import React, { useState } from 'react';
import UserForm from '../../../components/ui/Video-Interview/admin/UserForm';
import UserCard from '../../../components/ui/Video-Interview/admin/UserCard';
import { Users } from 'lucide-react';

const UserManagementPage = ({ users, setUsers, questionLists }) => {
    const [newUser, setNewUser] = useState({ name: '', email: '', assignedLists: [] });
    const [editingUser, setEditingUser] = useState(null);

    const handleSave = () => {
        if (newUser.name.trim() && newUser.email.trim()) {
        if (editingUser) {
            setUsers(prev => prev.map(user => 
            user.id === editingUser.id ? { ...newUser, id: editingUser.id } : user
            ));
            setEditingUser(null);
        } else {
            setUsers(prev => [...prev, { ...newUser, id: Date.now() }]);
        }
        setNewUser({ name: '', email: '', assignedLists: [] });
        }
    };

    const handleEdit = (user) => {
        setNewUser({ name: user.name, email: user.email, assignedLists: [...user.assignedLists] });
        setEditingUser(user);
    };

    const handleDelete = (id) => {
        setUsers(prev => prev.filter(user => user.id !== id));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserForm
            user={newUser}
            setUser={setNewUser}
            questionLists={questionLists}
            editingUser={editingUser}
            onSave={handleSave}
        />
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Daftar Pengguna</h2>
            
            {users.length === 0 ? (
            <div className="text-center py-12">
                <Users className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500">Belum ada pengguna</p>
            </div>
            ) : (
            <div className="space-y-4">
                {users.map(user => (
                <UserCard
                    key={user.id}
                    user={user}
                    questionLists={questionLists}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
                ))}
            </div>
            )}
        </div>
        </div>
    );
};
export default UserManagementPage;