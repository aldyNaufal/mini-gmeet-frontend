import React, { useState, useEffect } from 'react';
import QuestionListForm from '../../../components/ui/Video-Interview/admin/QuestionListForm';
import QuestionListCard from '../../../components/ui/Video-Interview/admin/QuestionListCard';
import { ListChecks } from 'lucide-react';
import axios from 'axios';

const API_URL = "http://localhost:8000/list/lists-all";
const CREATE_URL = "http://localhost:8000/list/create";

const QuestionListPage = ({ questionVideos, questionLists, setQuestionLists }) => {
    const [currentList, setCurrentList] = useState({ name: '', videoIds: [] });
    const [editingList, setEditingList] = useState(null);

    // ✅ Ambil semua list dari backend saat load
    useEffect(() => {
        const fetchLists = async () => {
            try {
                const response = await axios.get(API_URL);
                
                const mappedLists = response.data.map(list => ({
                    id: list.id_list_question,
                    name: list.list_title,
                    videoIds: list.questions.map(q => q.id_question)
                }));

                setQuestionLists(mappedLists);
            } catch (error) {
                console.error("Gagal mengambil list:", error);
            }
        };

        fetchLists();
    }, [setQuestionLists]);

    // ✅ SIMPAN (Create atau Update)
    const handleSave = async () => {
    if (!currentList.name.trim() || currentList.videoIds.length === 0) return;

    try {
        if (editingList) {
            // ✅ MODE EDIT
            const response = await axios.put(
                `http://localhost:8000/list/${editingList.id}`,
                {
                    list_title: currentList.name,
                    video_ids: currentList.videoIds
                }
            );

            // ✅ DIPERBAIKI: Update state dengan response backend yang konsisten
            setQuestionLists(prev =>
                prev.map(list =>
                    list.id === editingList.id
                        ? {
                            id: response.data.id_list_question,
                            name: response.data.list_title,
                            videoIds: currentList.videoIds
                          }
                        : list
                )
            );
            setEditingList(null);
        } else {
            // ✅ MODE CREATE
            const response = await axios.post('http://localhost:8000/list/create', {
                list_title: currentList.name,
                video_ids: currentList.videoIds
            });

            // ✅ DIPERBAIKI: Tambah list baru dengan struktur yang konsisten
            setQuestionLists(prev => [
                ...prev,
                {
                    id: response.data.id_list_question,
                    name: response.data.list_title,
                    videoIds: currentList.videoIds
                }
            ]);
        }

        // ✅ Reset form setelah berhasil
            setCurrentList({ name: '', videoIds: [] });
        } catch (error) {
            console.error("Gagal menyimpan list:", error);
            // ✅ OPSIONAL: Tambahkan notifikasi error untuk user
            alert("Gagal menyimpan list. Silakan coba lagi.");
        }
    };

    // ✅ EDIT → Mengisi ulang form dengan list yang dipilih
    const handleEdit = (list) => {
        setCurrentList({ name: list.name, videoIds: [...list.videoIds] });
        setEditingList(list);
    };

    // ✅ DIPERBAIKI: DELETE → Sekarang menggunakan backend endpoint
    const handleDelete = async (id) => {
        // ✅ OPSIONAL: Konfirmasi sebelum delete
        if (!window.confirm('Apakah Anda yakin ingin menghapus list ini?')) {
            return;
        }

        try {
            // ✅ DIPERBAIKI: Panggil endpoint DELETE backend
            await axios.delete(`http://localhost:8000/list/${id}`);
            
            // ✅ Update state setelah berhasil delete
            setQuestionLists(prev => prev.filter(list => list.id !== id));
            
            // ✅ OPSIONAL: Notifikasi sukses
            // alert("List berhasil dihapus!");
        } catch (error) {
            console.error("Gagal menghapus list:", error);
            // ✅ OPSIONAL: Notifikasi error
            alert("Gagal menghapus list. Silakan coba lagi.");
        }
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
