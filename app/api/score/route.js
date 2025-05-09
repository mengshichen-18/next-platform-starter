// app/api/score/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const scoringPrompts = [
  { key: '战略强度总体评分', prompt: '请根据以下企业文本片段，给出其数字化转型战略强度的总体评分（0-10）。定义：数字化转型战略指企业通过数字技术（如人工智能、大数据、云计算等）重塑业务流程、产品或商业模式，以实现效率提升、创新或竞争优势的战略意图。\n\n' },
  { key: '数字化战略导向维度', prompt: '请根据以下文本片段，判断企业在“数字化战略导向维度”的强度（0-10）。定义：企业从最高层面明确企业数字化的愿景、目标和路径，确保数字化工作与整体战略深度融合的程度。\n\n' },
  { key: '数字化组织与文化', prompt: '请根据以下文本片段，判断企业在“数字化组织与文化”方面的强度（0-10）。定义：企业构建支撑数字化转型的人才、文化和组织架构，激发内部创新活力的程度。参考示例：是否设立数字化部门、敏捷小组（如数字化项目管理办公室、数据中台团队）；是否有数字化技能（数据分析、云原生开发、AI应用等）培训与梯队建设等。\n\n' },
  { key: '数字化技术与平台', prompt: '请根据以下文本片段，判断企业在“数字化技术与平台”方面的强度（0-10）。定义：企业搭建开放、可扩展、可复用的技术基础设施和能力平台，为上层业务赋能的程度。参考示例：是否有云计算/边缘计算、微服务、API 管理、中台化设计等技术架构；是否有数据中台、AI/ML（人工智能、机器学习） 平台、IoT（物联网） 平台、DevOps（开发、测试、运维）/CI-CD （持续集成 /持续交付/ 持续部署）工具链等组件。\n\n' },
  { key: '数字化流程与运营', prompt: '请根据以下文本片段，判断企业在“数字化流程与运营”方面的强度（0-10）。定义：企业以流程再造和自动化为手段，提升业务效率与敏捷响应能力的程度。参考示例：是否用RPA、低代码、智能工作流替代人工、减少交接；是否运用在线监控看板、实时告警、持续优化（PDCA闭环）等数字化技术进行运营监控。\n\n' },
  { key: '数字化产品与服务', prompt: '请根据以下文本片段，判断企业在“数字化产品与服务”方面的强度（0-10）。定义：企业通过数字化手段创新或升级产品与商业模式，满足客户新需求的程度。参考示例：产品方面，包括是否用数字技术提升和发展产品性能，是否直接开发数字产品等；服务方面，包括是否有从一次性交易到订阅制、平台撮合、数据增值的服务；是否有全渠道触点、个性化推荐、智能客服与虚拟助理。\n\n' },
];

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');

  let fileText = '';
  if (file && file.arrayBuffer) {
    const buffer = Buffer.from(await file.arrayBuffer());
    fileText = buffer.toString('utf-8');
  }

  const results = {};

  try {
    for (const { key, prompt } of scoringPrompts) {
      const fullPrompt = prompt + fileText;

      const completion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: '你是一个评分助手，请严格返回一个 0-10 的整数，不要输出其他任何内容。' },
          { role: 'user', content: fullPrompt },
        ],
        model: 'deepseek-chat',
      });

      const scoreText = completion.choices[0].message.content.trim();
      const parsedScore = parseInt(scoreText.match(/\d+/)?.[0] || '-1');
      results[key] = parsedScore;
      console.log(`${key} 评分结果:`, parsedScore)
    }
    // console.log('评分结果:', results)
    return NextResponse.json(results);
  } catch (err) {
    console.error('评分失败:', err);
    return NextResponse.json({ error: '评分失败' }, { status: 500 });
  }
}
