import React, { useState } from 'react';
import UserForm from '../../../components/ui/Video-Interview/admin/UserForm';
import UserCard from '../../../components/ui/Video-Interview/admin/UserCard';
import { Users } from 'lucide-react';
import axios from 'axios';
import { useEffect } from 'react';
import api from '../../../api/axios';

const UserManagementPage = ({ questionLists }) => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
        assigned_list_id: null
    });

    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
        try {
            const res = await api.get("/users/all");
            setUsers(res.data);
        } catch (error) {
            console.error('Gagal mengambil user:', error.response?.data || error.message);
        }
        };

        fetchUsers();
    }, []);

    const handleSave = async () => {
        try {
        if (editingUser) {
            // update → kalau kamu punya endpoint PUT /users/{id}, bisa diubah
            // sementara aku skip karena di backend belum dikasih
        } else {
            const res = await api.post("/users/create", newUser);
            setUsers(prev => [...prev, res.data]);
        }

        setNewUser({
            name: '',
            email: '',
            password: '',
            role: 'user',
            assigned_list_id: null
        });
        setEditingUser(null);
        } catch (error) {
        console.error('Gagal menyimpan user:', error.response?.data || error.message);
        }
    };


    const handleEdit = (user) => {
    setNewUser({
        name: user.name,
        email: user.email,
        role: user.role,
        assigned_list_id: user.assigned_list_id,
        password: '' // kosongkan dulu
    });
        setEditingUser(user);
    };

    const handleDelete = async (id) => {
    try {
        await api.delete(`/users/${id}`);
        setUsers(prev => prev.filter(user => user.id_user !== id));
        } catch (err) {
        console.error('Gagal menghapus', err);
        }
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
                    key={user.id_user}
                    user={user}
                    questionLists={questionLists}
                    onEdit={handleEdit}
                    onDelete={() => handleDelete(user.id_user)}
                />
                ))}
            </div>
            )}
        </div>
        </div>
    );
};
export default UserManagementPage;