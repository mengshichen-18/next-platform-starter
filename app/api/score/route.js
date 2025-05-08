import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Readable } from 'stream';

// 初始化 DeepSeek 客户端
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-0ad6d4515579467f861e113efe4c6f43',
});

// 解析 multipart/form-data 文件
export async function POST(req) {
  const formData = await req.formData();

  const file = formData.get('file'); // 类型是 Blob
  const text = formData.get('text') || '';

  let fileText = '';

  // 如果用户上传了文件，读取其内容
  if (file && file.arrayBuffer) {
    const buffer = Buffer.from(await file.arrayBuffer());
    fileText = buffer.toString('utf-8'); // 假设是 utf-8 文本格式
  }

  const prompt = `
你将收到两个部分的输入：
1. 用户上传的文件内容（可选）
2. 用户输入的文本（可选）

请对它们整体进行理解，并输出一个结构化的评分JSON：
{
  "评分": 整数1-10,
  "理由": "概括用户的文件和文本内容",
  "改进建议": "简洁描述"
}

【文件内容】：
${fileText || '[无上传文件]'}

【用户输入文本】：
${text || '[无补充文本]'}
`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: '你是一个负责评分的AI助手。' },
        { role: 'user', content: prompt },
      ],
      model: 'deepseek-chat',
    });

    const resultText = completion.choices[0].message.content;

    // 构造一个JSON文件返回
    return new Response(resultText, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename=score.json',
      },
    });
  } catch (err) {
    console.error('Error calling DeepSeek:', err);
    return NextResponse.json({ error: '调用大模型失败' }, { status: 500 });
  }
}
