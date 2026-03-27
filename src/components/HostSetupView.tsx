"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Play, Trash2, FileUp } from 'lucide-react';
import type { Question, QuestionPair, QuestionType } from '@/types';

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
      className="max-w-4xl mx-auto mt-6 md:mt-10 px-3 md:px-4 pb-20"
    >
      <div className="glass-card p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <h2 className="text-xl md:text-3xl font-black text-blue-deep">Thiết lập bộ câu hỏi</h2>
          <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
            <button onClick={onDownloadTemplate} className="btn-blue flex items-center gap-1 md:gap-2 text-xs md:text-sm px-3 md:px-4">
              <FileUp size={16} /> <span className="hidden sm:inline">Tải file mẫu</span><span className="sm:hidden">Mẫu</span>
            </button>
            <label className="btn-blue cursor-pointer flex items-center gap-1 md:gap-2 text-xs md:text-sm px-3 md:px-4">
              <FileUp size={16} /> <span className="hidden sm:inline">Nhập Excel</span><span className="sm:hidden">Import</span>
              <input type="file" accept=".xlsx, .xls" onChange={onImportExcel} className="hidden" />
            </label>
            <button onClick={onCreateRoom} disabled={isCreatingRoom} className="btn-primary flex items-center gap-1 md:gap-2 text-xs md:text-sm px-3 md:px-4">
              {isCreatingRoom ? 'Đang tạo...' : 'Tạo phòng'} <Play size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-slate-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-100 relative group">
              <button
                onClick={() => setQuestions(prev => prev.filter((_, i) => i !== idx))}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 md:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <Trash2 size={14} className="md:w-4 md:h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                <div className="md:col-span-8">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Câu hỏi {idx + 1}</label>
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                    className="input-field text-base md:text-lg font-bold"
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

              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-100">
                {(q.type === 'multiple-choice' || q.type === 'image') && (
                  <div className="space-y-3 md:space-y-4">
                    {q.type === 'image' && (
                      <div className="mb-3 md:mb-4">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Link ảnh (URL)</label>
                        <div className="flex gap-2 md:gap-3">
                          <input
                            type="text"
                            value={q.imageUrl || ''}
                            onChange={(e) => updateQuestion(idx, 'imageUrl', e.target.value)}
                            className="input-field text-sm"
                            placeholder="https://example.com/image.jpg"
                          />
                          {q.imageUrl && (
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                              <img src={q.imageUrl} alt="Xem trước ảnh câu hỏi" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {(q.options || ['', '', '', '']).map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 md:gap-3">
                          <input
                            type="radio"
                            checked={q.correctIndex === oIdx}
                            onChange={() => updateQuestion(idx, 'correctIndex', oIdx)}
                            className="w-4 h-4 md:w-5 md:h-5 accent-primary"
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
                  <div className="space-y-2 md:space-y-3">
                    {(q.pairs || [{ left: '', right: '' }]).map((pair, pIdx) => (
                      <div key={pIdx} className="grid grid-cols-2 gap-3 md:gap-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
            <button onClick={() => addQuestion('multiple-choice')} className="py-3 md:py-4 bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl font-bold uppercase text-[10px] md:text-xs hover:border-primary transition-colors">Trắc nghiệm</button>
            <button onClick={() => addQuestion('matching')} className="py-3 md:py-4 bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl font-bold uppercase text-[10px] md:text-xs hover:border-primary transition-colors">Nối chữ</button>
            <button onClick={() => addQuestion('scramble')} className="py-3 md:py-4 bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl font-bold uppercase text-[10px] md:text-xs hover:border-primary transition-colors">Ghép chữ</button>
            <button onClick={() => addQuestion('guess')} className="py-3 md:py-4 bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl font-bold uppercase text-[10px] md:text-xs hover:border-primary transition-colors">Đoán chữ</button>
            <button onClick={() => addQuestion('image')} className="py-3 md:py-4 bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl font-bold uppercase text-[10px] md:text-xs hover:border-primary transition-colors col-span-2 sm:col-span-1">Hình ảnh</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
