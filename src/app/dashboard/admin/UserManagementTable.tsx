'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  departmentId: string | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface UserManagementTableProps {
  users: User[];
  departments: Department[];
}

export default function UserManagementTable({ users, departments }: UserManagementTableProps) {
  const [userList, setUserList] = useState<User[]>(users);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string, currentDeptId: string | null) => {
    await submitChange(userId, newRole, currentDeptId);
  };

  const handleDeptChange = async (userId: string, currentRole: string, newDeptId: string | null) => {
    await submitChange(userId, currentRole, newDeptId);
  };

  const submitChange = async (userId: string, role: string, departmentId: string | null) => {
    setUpdatingUserId(userId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          departmentId: departmentId === 'none' ? null : departmentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user parameters.');
      }

      setSuccess(`Updated ${data.user.fullName} successfully.`);
      
      // Update local state
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, role, departmentId } : u));

    } catch (err: any) {
      setError(err.message || 'Error updating user.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className={styles.tableWrapper}>
      {error && (
        <div className="badge badge-rejected" style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="badge badge-approved" style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem', textAlign: 'center' }}>
          {success}
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department Scope</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {userList.map((user) => (
            <tr key={user.id}>
              <td><strong style={{ color: 'hsl(var(--text-primary))' }}>{user.fullName}</strong></td>
              <td>{user.email}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value, user.departmentId)}
                  disabled={updatingUserId === user.id}
                  className={styles.roleSelect}
                >
                  <option value="STUDENT">Student</option>
                  <option value="ADVISOR">Advisor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
              <td>
                <select
                  value={user.departmentId || 'none'}
                  onChange={(e) => handleDeptChange(user.id, user.role, e.target.value === 'none' ? null : e.target.value)}
                  disabled={updatingUserId === user.id}
                  className={styles.roleSelect}
                >
                  <option value="none">None (General Scope)</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </td>
              <td>
                {updatingUserId === user.id ? (
                  <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></span>
                ) : (
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Active</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
