import React, { useState } from 'react';
import QuestionListForm from '../../../components/ui/Video-Interview/admin/QuestionListForm';
import QuestionListCard from '../../../components/ui/Video-Interview/admin/QuestionListCard';
import { ListChecks } from 'lucide-react';

const QuestionListPage = ({ 
    questionVideos, 
    questionLists, 
    setQuestionLists 
    }) => {
    const [currentList, setCurrentList] = useState({ name: '', videoIds: [] });
    const [editingList, setEditingList] = useState(null);

    const handleSave = () => {
        if (currentList.name.trim() && currentList.videoIds.length > 0) {
        if (editingList) {
            setQuestionLists(prev => prev.map(list => 
            list.id === editingList.id ? { ...currentList, id: editingList.id } : list
            ));
            setEditingList(null);
        } else {
            setQuestionLists(prev => [...prev, { ...currentList, id: Date.now() }]);
        }
        setCurrentList({ name: '', videoIds: [] });
        }
    };

    const handleEdit = (list) => {
        setCurrentList({ name: list.name, videoIds: [...list.videoIds] });
        setEditingList(list);
    };

    const handleDelete = (id) => {
        setQuestionLists(prev => prev.filter(list => list.id !== id));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuestionListForm
            currentList={currentList}
            setCurrentList={setCurrentList}
            questionVideos={questionVideos}
            editingList={editingList}
            onSave={handleSave}
        />
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">List Pertanyaan Tersimpan</h2>
            
            {questionLists.length === 0 ? (
            <div className="text-center py-12">
                <ListChecks className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500">Belum ada list pertanyaan</p>
            </div>
            ) : (
            <div className="space-y-4">
                {questionLists.map(list => (
                <QuestionListCard
                    key={list.id}
                    list={list}
                    questionVideos={questionVideos}
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
export default QuestionListPage;