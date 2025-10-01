import React from 'react';
import { Save } from 'lucide-react';

const UserForm = ({ 
    user, 
    setUser, 
    questionLists, 
    editingUser, 
    onSave 
    }) => {
    const toggleListAssignment = (listId) => {
        setUser(prev => ({
        ...prev,
        assignedLists: prev.assignedLists.includes(listId)
            ? prev.assignedLists.filter(id => id !== listId)
            : [...prev.assignedLists, listId]
        }));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
        </h2>
        
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nama
            </label>
            <input
            type="text"
            placeholder="Nama lengkap"
            value={user.name}
            onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
        </div>

        <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email
            </label>
            <input
            type="email"
            placeholder="email@example.com"
            value={user.email}
            onChange={(e) => setUser(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
        </div>

        <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
            Assign List Pertanyaan
            </label>
            {questionLists.length === 0 ? (
            <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                Belum ada list pertanyaan tersedia. Buat list pertanyaan terlebih dahulu.
            </p>
            ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {questionLists.map(list => (
                <label key={list.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                    type="checkbox"
                    checked={user.assignedLists.includes(list.id)}
                    onChange={() => toggleListAssignment(list.id)}
                    className="w-5 h-5 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                    <p className="text-gray-900 font-semibold">{list.name}</p>
                    <p className="text-gray-600 text-sm">{list.videoIds.length} video</p>
                    </div>
                </label>
                ))}
            </div>
            )}
        </div>

        <button
            onClick={onSave}
            disabled={!user.name.trim() || !user.email.trim()}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
        >
            <Save size={18} /> {editingUser ? 'Update' : 'Simpan'} Pengguna
        </button>
        </div>
    );
};
export default UserForm;