import * as XLSX from 'xlsx';
import type { Question, QuestionType, LeaderboardEntry } from '../types';

type ExcelRow = Record<string, unknown>;

export function exportToExcel(
  leaderboard: LeaderboardEntry[],
  questions: Question[],
  roomId: string,
) {
  if (!leaderboard.length) return;

  const resultsData = leaderboard.map((entry, idx) => ({
    'Hạng': idx + 1,
    'Tên người chơi': entry.name,
    'Tổng điểm': entry.score,
    'Số câu đúng': entry.correctCount,
    'Tổng số câu': entry.totalQuestions,
    'Tỷ lệ chính xác (%)': Math.round((entry.correctCount / entry.totalQuestions) * 100)
  }));

  const questionsData = questions.map((q, idx) => {
    let answer = '';
    if (q.type === 'multiple-choice' || q.type === 'image') {
      answer = q.options?.[q.correctIndex || 0] || '';
    } else if (q.type === 'matching') {
      answer = q.pairs?.map(p => `${p.left} - ${p.right}`).join(', ') || '';
    } else {
      answer = q.correctWord || '';
    }

    return {
      'STT': idx + 1,
      'Câu hỏi': q.text,
      'Loại câu hỏi': q.type,
      'Đáp án chính xác': answer,
      'Thời gian (s)': q.timeLimit || 30
    };
  });

  const wb = XLSX.utils.book_new();
  const wsResults = XLSX.utils.json_to_sheet(resultsData);
  const wsQuestions = XLSX.utils.json_to_sheet(questionsData);

  XLSX.utils.book_append_sheet(wb, wsResults, "Kết quả người chơi");
  XLSX.utils.book_append_sheet(wb, wsQuestions, "Đề bài");

  const fileName = `GHN_Quiz_Report_${new Date().toISOString().slice(0, 10)}_${roomId}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function downloadTemplate() {
  const templateData = [
    {
      'Câu hỏi': 'Thủ đô của Việt Nam là gì?',
      'Loại câu hỏi': 'multiple-choice',
      'Lựa chọn 1': 'Hồ Chí Minh',
      'Lựa chọn 2': 'Hà Nội',
      'Lựa chọn 3': 'Đà Nẵng',
      'Lựa chọn 4': 'Huế',
      'Đáp án đúng': 1,
      'Thời gian': 30
    },
    {
      'Câu hỏi': 'Sắp xếp các chữ cái sau thành tên một thành phố:',
      'Loại câu hỏi': 'scramble',
      'Đáp án': 'ĐÀ NẴNG',
      'Từ xáo trộn': 'N G A N D A',
      'Thời gian': 30
    },
    {
      'Câu hỏi': 'Nhìn ảnh và cho biết đây là gì?',
      'Loại câu hỏi': 'image',
      'Link ảnh': 'https://picsum.photos/seed/ghn/800/600',
      'Lựa chọn 1': 'Con mèo',
      'Lựa chọn 2': 'Cái cây',
      'Lựa chọn 3': 'Thành phố',
      'Lựa chọn 4': 'Biển cả',
      'Đáp án đúng': 1,
      'Thời gian': 30
    },
    {
      'Câu hỏi': 'Nối các cặp sau:',
      'Loại câu hỏi': 'matching',
      'Vế trái 1': 'Hà Nội', 'Vế phải 1': 'Miền Bắc',
      'Vế trái 2': 'Đà Nẵng', 'Vế phải 2': 'Miền Trung',
      'Vế trái 3': 'Hồ Chí Minh', 'Vế phải 3': 'Miền Nam',
      'Thời gian': 30
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, "GHN_Quiz_Template.xlsx");
}

export function parseImportedExcel(
  file: File,
  onSuccess: (questions: Question[]) => void,
  onError: (message: string) => void,
) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      if (!wsname) {
        onError('File Excel không có sheet hợp lệ.');
        return;
      }
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json<ExcelRow>(ws);

      if (!data || data.length === 0) {
        onError('File Excel không có dữ liệu hoặc sai định dạng.');
        return;
      }

      const importedQuestions: Question[] = data.map((row, idx: number) => {
        const rowKeys = Object.keys(row);
        const getVal = (keys: string[]) => {
          for (const k of keys) {
            const foundKey = rowKeys.find(rk => rk.toLowerCase().trim() === k.toLowerCase());
            if (foundKey) return row[foundKey];
          }
          return undefined;
        };

        const rawType = getVal(['type', 'loại', 'loại câu hỏi', 'question type'])?.toString().toLowerCase().trim() || 'multiple-choice';

        let type: QuestionType = 'multiple-choice';
        if (rawType.includes('nối') || rawType === 'matching') type = 'matching';
        else if (rawType.includes('xáo trộn') || rawType === 'scramble') type = 'scramble';
        else if (rawType.includes('đoán') || rawType === 'guess') type = 'guess';
        else if (rawType.includes('ảnh') || rawType === 'image') type = 'image';

        const q: Question = {
          type,
          text: getVal(['text', 'câu hỏi', 'nội dung', 'question'])?.toString() || `Câu hỏi ${idx + 1}`,
          timeLimit: Number(getVal(['timeLimit', 'thời gian', 'giới hạn thời gian', 'time']) ?? 30) || 30
        };

        if (type === 'multiple-choice' || type === 'image') {
          q.options = [
            getVal(['opt1', 'đáp án 1', 'lựa chọn 1', 'option 1']),
            getVal(['opt2', 'đáp án 2', 'lựa chọn 2', 'option 2']),
            getVal(['opt3', 'đáp án 3', 'lựa chọn 3', 'option 3']),
            getVal(['opt4', 'đáp án 4', 'lựa chọn 4', 'option 4'])
          ].map(o => o?.toString() || '').filter(Boolean);

          if (q.options.length < 2) q.options = ['Lựa chọn 1', 'Lựa chọn 2'];

          const cIdx = getVal(['correctIndex', 'đáp án đúng', 'vị trí đáp án đúng', 'correct index']);
          q.correctIndex = (Number(cIdx ?? 0) || 0);
          if (q.correctIndex >= 1 && q.correctIndex <= 4 && !rowKeys.some(k => k.toLowerCase() === 'correctindex')) {
            q.correctIndex -= 1;
          }

          if (type === 'image') q.imageUrl = getVal(['imageUrl', 'link ảnh', 'image url', 'image'])?.toString();
        } else if (type === 'matching') {
          q.pairs = [
            { left: getVal(['left1', 'vế trái 1', 'l1'])?.toString() || '', right: getVal(['right1', 'vế phải 1', 'r1'])?.toString() || '' },
            { left: getVal(['left2', 'vế trái 2', 'l2'])?.toString() || '', right: getVal(['right2', 'vế phải 2', 'r2'])?.toString() || '' },
            { left: getVal(['left3', 'vế trái 3', 'l3'])?.toString() || '', right: getVal(['right3', 'vế phải 3', 'r3'])?.toString() || '' }
          ].filter(p => p.left && p.right);
          if (q.pairs!.length === 0) q.pairs = [{ left: 'A', right: '1' }];
        } else if (type === 'scramble' || type === 'guess') {
          q.correctWord = (getVal(['correctWord', 'từ đúng', 'đáp án', 'answer']) || '').toString().toUpperCase().trim();
          if (type === 'scramble') {
            q.scrambledWord = (getVal(['scrambledWord', 'từ xáo trộn', 'scrambled']) || q.correctWord || '').toString().toUpperCase().trim();
          }
        }
        return q;
      });

      onSuccess(importedQuestions);
    } catch (err) {
      console.error('Excel Import Error:', err);
      onError('Có lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng.');
    }
  };
  reader.readAsBinaryString(file);
}
