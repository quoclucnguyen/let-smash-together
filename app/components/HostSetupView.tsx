"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Play, Trash2, FileUp } from 'lucide-react';
import type { Question, QuestionPair, QuestionType } from '../types';

interface HostSetupViewProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  isCreatingRoom: boolean;
  onCreateRoom: () => void;
  onDownloadTemplate: () => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function HostSetupView({
  questions,
  setQuestions,
  isCreatingRoom,
  onCreateRoom,
  onDownloadTemplate,
  onImportExcel,
}: HostSetupViewProps) {
  const addQuestion = (type: QuestionType) => {
    const newQ: Question = { type, text: '', timeLimit: 30 };
    if (type === 'multiple-choice' || type === 'image') {
      newQ.options = ['', '', '', ''];
      newQ.correctIndex = 0;
      if (type === 'image') newQ.imageUrl = '';
    } else if (type === 'matching') {
      newQ.pairs = [{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }];
    } else if (type === 'scramble' || type === 'guess') {
      newQ.correctWord = '';
      if (type === 'scramble') newQ.scrambledWord = '';
    }
    setQuestions(prev => [...prev, newQ]);
  };

  const updateQuestion = <K extends keyof Question>(index: number, field: K, value: Question[K]) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return newQuestions;
    });
  };

  return (
    <motion.div
      key="host-setup"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto mt-10 px-4 pb-20"
    >
      <div className="glass-card p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-blue-deep">Thiết lập bộ câu hỏi</h2>
          <div className="flex gap-3">
            <button onClick={onDownloadTemplate} className="btn-blue flex items-center gap-2 text-sm">
              <FileUp size={18} /> Tải file mẫu
            </button>
            <label className="btn-blue cursor-pointer flex items-center gap-2 text-sm">
              <FileUp size={18} /> Nhập Excel
              <input type="file" accept=".xlsx, .xls" onChange={onImportExcel} className="hidden" />
            </label>
            <button onClick={onCreateRoom} disabled={isCreatingRoom} className="btn-primary flex items-center gap-2 text-sm">
              {isCreatingRoom ? 'Đang tạo...' : 'Tạo phòng'} <Play size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative group">
              <button
                onClick={() => setQuestions(prev => prev.filter((_, i) => i !== idx))}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <Trash2 size={16} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Câu hỏi {idx + 1}</label>
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                    className="input-field text-lg font-bold"
                    placeholder="Nhập nội dung câu hỏi..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Loại</label>
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(idx, 'type', e.target.value as QuestionType)}
                    className="input-field text-sm font-bold appearance-none"
                  >
                    <option value="multiple-choice">Trắc nghiệm</option>
                    <option value="image">Nhìn ảnh</option>
                    <option value="matching">Nối cặp</option>
                    <option value="scramble">Sắp xếp</option>
                    <option value="guess">Đoán chữ</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Thời gian (s)</label>
                  <input
                    type="number"
                    value={q.timeLimit}
                    onChange={(e) => updateQuestion(idx, 'timeLimit', parseInt(e.target.value))}
                    className="input-field text-sm font-bold"
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                {(q.type === 'multiple-choice' || q.type === 'image') && (
                  <div className="space-y-4">
                    {q.type === 'image' && (
                      <div className="mb-4">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Link ảnh (URL)</label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={q.imageUrl || ''}
                            onChange={(e) => updateQuestion(idx, 'imageUrl', e.target.value)}
                            className="input-field text-sm"
                            placeholder="https://example.com/image.jpg"
                          />
                          {q.imageUrl && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                              <img src={q.imageUrl} alt="Xem trước ảnh câu hỏi" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(q.options || ['', '', '', '']).map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={q.correctIndex === oIdx}
                            onChange={() => updateQuestion(idx, 'correctIndex', oIdx)}
                            className="w-5 h-5 accent-primary"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(q.options || ['', '', '', ''])];
                              newOpts[oIdx] = e.target.value;
                              updateQuestion(idx, 'options', newOpts);
                            }}
                            className="input-field text-sm"
                            placeholder={`Lựa chọn ${oIdx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {q.type === 'matching' && (
                  <div className="space-y-3">
                    {(q.pairs || [{ left: '', right: '' }]).map((pair, pIdx) => (
                      <div key={pIdx} className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={pair.left}
                          onChange={(e) => {
                            const newPairs: QuestionPair[] = [...(q.pairs || [])];
                            newPairs[pIdx] = { ...newPairs[pIdx], left: e.target.value };
                            updateQuestion(idx, 'pairs', newPairs);
                          }}
                          className="input-field text-sm"
                          placeholder="Vế trái"
                        />
                        <input
                          type="text"
                          value={pair.right}
                          onChange={(e) => {
                            const newPairs: QuestionPair[] = [...(q.pairs || [])];
                            newPairs[pIdx] = { ...newPairs[pIdx], right: e.target.value };
                            updateQuestion(idx, 'pairs', newPairs);
                          }}
                          className="input-field text-sm"
                          placeholder="Vế phải"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {(q.type === 'scramble' || q.type === 'guess') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Đáp án đúng</label>
                      <input
                        type="text"
                        value={q.correctWord || ''}
                        onChange={(e) => updateQuestion(idx, 'correctWord', e.target.value.toUpperCase())}
                        className="input-field text-sm font-bold"
                        placeholder="VD: HANOI"
                      />
                    </div>
                    {q.type === 'scramble' && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Từ xáo trộn (Tùy chọn)</label>
                        <input
                          type="text"
                          value={q.scrambledWord || ''}
                          onChange={(e) => updateQuestion(idx, 'scrambledWord', e.target.value.toUpperCase())}
                          className="input-field text-sm"
                          placeholder="VD: H A N O I"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <button onClick={() => addQuestion('multiple-choice')} className="flex-1 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold uppercase text-xs hover:border-primary transition-colors">Trắc nghiệm</button>
            <button onClick={() => addQuestion('matching')} className="flex-1 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold uppercase text-xs hover:border-primary transition-colors">Nối chữ</button>
            <button onClick={() => addQuestion('scramble')} className="flex-1 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold uppercase text-xs hover:border-primary transition-colors">Ghép chữ</button>
            <button onClick={() => addQuestion('guess')} className="flex-1 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold uppercase text-xs hover:border-primary transition-colors">Đoán chữ</button>
            <button onClick={() => addQuestion('image')} className="flex-1 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold uppercase text-xs hover:border-primary transition-colors">Hình ảnh</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
