import react from  "react";
import { Edit2, Trash2 } from "lucide-react";

const UserCard = ({ user, questionLists, onEdit, onDelete }) => {
    return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
            <h3 className="text-gray-900 font-bold text-lg">{user.name}</h3>
            <p className="text-gray-600 text-sm">{user.email}</p>
            </div>
            <div className="flex gap-2">
            <button
                onClick={() => onEdit(user)}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            >
                <Edit2 className="text-blue-600" size={18} />
            </button>
            <button
                onClick={() => onDelete(user.id)}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            >
                <Trash2 className="text-red-600" size={18} />
            </button>
            </div>
        </div>
        
        {user.assignedLists?.length > 0 && (
            <div>
            <p className="text-gray-700 text-sm font-semibold mb-2">List yang di-assign:</p>
            <div className="flex flex-wrap gap-2">
                {user.assignedLists.map(listId => {
                const list = questionLists.find(l => l.id === listId);
                return list ? (
                    <span key={listId} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {list.name} ({list.videoIds.length} video)
                    </span>
                ) : null;
                })}
            </div>
            </div>
        )}
        </div>
    );
};
export default UserCard;