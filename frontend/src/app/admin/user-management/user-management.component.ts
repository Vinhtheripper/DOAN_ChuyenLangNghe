import { Component, OnInit } from '@angular/core';
import { UserAPIService } from '../../user-api.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../../interface/User';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  editingUserId: string | null = null;
  editedUser: Partial<User> = {};
  searchKeyword: string = '';
  currentPage: number = 1;
  totalPages: number = 0;
  roles = ['user', 'admin'];
  actions = ['just view', 'edit all', 'account ctrl', 'sales ctrl'];
  genders = ['male', 'female'];
  canEdit: boolean = false;
  canView: boolean = false;

  constructor(
    private userService: UserAPIService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.setPermissions();
    if (this.canView) {
      this.loadUsers();
    }
  }

  setPermissions(): void {
    const action = this.authService.getAction();
    this.canEdit = action === 'edit all' || action === 'account ctrl';
    this.canView = this.canEdit || action === 'just view';
  }

  loadUsers(page: number = 1): void {
    if (!this.canView) {
      return;
    }
    this.userService.getUsers(page, 10, this.searchKeyword).subscribe({
      next: (response) => {
        this.users = response.users;
        this.currentPage = page;
        this.totalPages = response.pages;
      },
      error: (err) => {
        console.error('Failed to load users:', err);
      }
    });
  }

  onSearch(): void {
    this.loadUsers(1);
  }

  startEditing(user: User): void {
    if (!this.canEdit) {
      return;
    }
    if (!user._id) {
      return;
    }
    const currentUserAction = this.authService.getAction();
    if (currentUserAction === 'account ctrl' && user.action === 'edit all') {
      alert('You cannot edit users with the "edit all" action.');
      return;
    }
    this.editingUserId = user._id;
    this.editedUser = { ...user };
  }

  saveEditing(userId: string | null): void {
    if (!userId || this.editingUserId !== userId) return;

    const currentUserAction = this.authService.getAction();
    if (currentUserAction === 'account ctrl' && this.editedUser.action === 'edit all') {
      alert('You cannot assign the "edit all" action.');
      return;
    }

    this.userService.updateUserProfile(userId, this.editedUser).subscribe({
      next: () => {
        const index = this.users.findIndex(user => user._id === userId);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...this.editedUser };
        }
        this.cancelEditing();
      },
      error: (err) => {
        console.error('Failed to update user:', err);
      }
    });
  }

  cancelEditing(): void {
    this.editingUserId = null;
    this.editedUser = {};
  }

  onDeleteUser(userId: string | null): void {
    if (!this.canEdit) {
      return;
    }
    if (!userId) {
      return;
    }
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUserAccount(userId).subscribe({
        next: () => {
          this.users = this.users.filter(user => user._id !== userId);
        },
        error: (err) => {
          console.error('Failed to delete user:', err);
        }
      });
    }
  }

  onPageChange(page: number): void {
    this.loadUsers(page);
  }
}
