package com.titan.app.features.group

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.titan.app.domain.model.Group
import com.titan.app.domain.usecase.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class GroupUiState(
    val groups: List<Group> = emptyList(),
    val isLoading: Boolean = false
)

data class GroupDetailUiState(
    val group: Group? = null,
    val balances: List<GroupMemberBalance> = emptyList(),
    val optimizedPayments: List<OptimizedPayment> = emptyList(),
    val isLoading: Boolean = false
)

@HiltViewModel
class GroupViewModel @Inject constructor(
    private val getGroupsUseCase: GetGroupsUseCase,
    private val createGroupUseCase: CreateGroupUseCase,
    private val getGroupBalancesUseCase: GetGroupBalancesUseCase,
    private val simplifyGroupSettlementUseCase: SimplifyGroupSettlementUseCase,
    private val groupRepository: com.titan.app.domain.repository.GroupRepository
) : ViewModel() {

    val uiState: StateFlow<GroupUiState> = getGroupsUseCase()
        .map { GroupUiState(groups = it) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = GroupUiState(isLoading = true)
        )

    private val _detailState = MutableStateFlow(GroupDetailUiState())
    val detailState: StateFlow<GroupDetailUiState> = _detailState.asStateFlow()

    fun createGroup(name: String, members: List<String>) {
        viewModelScope.launch {
            createGroupUseCase(name, members)
        }
    }

    fun loadGroupDetail(groupId: String) {
        viewModelScope.launch {
            _detailState.update { it.copy(isLoading = true) }
            val group = groupRepository.getGroupById(groupId)
            
            getGroupBalancesUseCase(groupId).collect { balances ->
                val optimized = simplifyGroupSettlementUseCase(balances)
                _detailState.update { 
                    it.copy(
                        group = group,
                        balances = balances,
                        optimizedPayments = optimized,
                        isLoading = false
                    )
                }
            }
        }
    }
}
