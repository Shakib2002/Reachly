import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const { summary, mode = 'job' } = await request.json();

    // Rate limit: 10 AI insights per 60 seconds per IP
    const rateLimited = await applyRateLimit(request, 'sensitive');
    if (rateLimited) return rateLimited;

    if (!summary) return NextResponse.json({ error: 'Summary required' }, { status: 400 });

    const aiKey = process.env.AI_API_KEY;
    const aiBase = process.env.AI_BASE_URL || 'https://api.modelrouter.app/v1';
    const aiModel = process.env.AI_MODEL || 'google/gemini-2.5-flash';

    const modeContext = mode === 'job'
      ? 'job seeker tracking job applications and outreach'
      : mode === 'client'
      ? 'freelancer/agency owner tracking client acquisition'
      : 'professional tracking both job applications and client acquisition';

    const systemPrompt = `You are a career and business coach analyzing job search and client acquisition data for a ${modeContext}. Provide specific, data-driven insights.`;

    const userPrompt = `Based on this analytics data, provide exactly 5 short, specific, actionable insights. Each insight should be 1-2 sentences and reference actual numbers from the data. Return ONLY a JSON array of strings, no markdown.

Mode: ${mode}
Data: ${JSON.stringify(summary, null, 2)}`;

    if (aiKey) {
      try {
        const res = await fetch(`${aiBase}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiKey}` },
          body: JSON.stringify({
            model: aiModel,
            max_tokens: 800,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || '[]';
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const insights = JSON.parse(cleaned);
          if (Array.isArray(insights) && insights.length > 0) {
            return NextResponse.json({ insights });
          }
        }
      } catch (e) { console.warn('AI API failed:', e); }
    }

    // Smart fallback based on mode
    const insights: string[] = [];

    if (mode === 'job') {
      const { totalLeads = 0, emailsSent = 0, byStatus = [], bySource = [] } = summary.job || summary;
      const statusMap: Record<string, number> = {};
      (byStatus as { status: string; count: number }[]).forEach(s => { statusMap[s.status] = s.count; });
      const topSrc = [...(bySource as { source: string; count: number }[])].sort((a, b) => b.count - a.count)[0];

      if (totalLeads === 0) {
        insights.push('Start by adding leads from the Discover page to begin tracking your job search pipeline.');
      } else {
        if ((statusMap.new || 0) > totalLeads * 0.5) insights.push(`${Math.round((statusMap.new / totalLeads) * 100)}% of your leads are still in "New" — start applying to move them forward.`);
        if ((statusMap.interview || 0) > 0) insights.push(`You have ${statusMap.interview} lead(s) in the interview stage — send a thank-you follow-up within 24 hours for best results.`);
        if ((statusMap.offer || 0) > 0) insights.push(`Congratulations on ${statusMap.offer} offer(s)! Your overall conversion rate is ${Math.round((statusMap.offer / totalLeads) * 100)}%.`);
        if (topSrc) insights.push(`"${topSrc.source}" is your top lead source with ${topSrc.count} leads — invest more time here.`);
        if (emailsSent === 0) insights.push("You haven't sent any outreach emails yet — personalized cold emails increase response rates by up to 3x.");
        else insights.push(`You've sent ${emailsSent} emails in this period. Leads contacted within 3 days of applying see 2x better response rates.`);
        if ((statusMap.applied || 0) > 3 && (statusMap.interview || 0) === 0) insights.push('You have multiple applications but no interviews yet — consider tailoring your resume for each job description.');
      }
    } else if (mode === 'client') {
      const { totalClients = 0, projectsWon = 0, projectsLost = 0, winRate = 0, bySource = [] } = summary.client || summary;
      const topSrc = [...(bySource as { source: string; count: number }[])].sort((a, b) => b.count - a.count)[0];

      if (totalClients === 0) {
        insights.push('Add your first client leads to the Client Pipeline to start tracking your agency\'s growth.');
      } else {
        insights.push(`Your current win rate is ${winRate}% — industry average for agencies is 25-30%. ${winRate >= 30 ? 'Great work!' : 'Focus on proposal quality to improve.'}`);
        if (topSrc) insights.push(`"${topSrc.source}" brings the most clients (${topSrc.count}) — prioritize this channel for new outreach.`);
        if (projectsWon > 0) insights.push(`You've won ${projectsWon} project(s). Upselling existing clients costs 5x less than acquiring new ones.`);
        if (projectsLost > 0) insights.push(`You've lost ${projectsLost} project(s) — consider following up with lost clients after 30 days as circumstances often change.`);
        insights.push('Sending proposals within 24 hours of initial contact improves win rates by up to 30%.');
      }
    } else {
      const { job = {}, client = {} } = summary;
      insights.push(`Job pipeline: ${job.totalLeads || 0} leads tracked. Client pipeline: ${client.totalClients || 0} clients tracked.`);
      insights.push('Diversifying between job seeking and freelance clients reduces income risk and accelerates financial stability.');
      insights.push('Your most active pipeline deserves the most attention — review both weekly to stay on top of opportunities.');
      insights.push('Set a goal: apply to 3 jobs AND prospect 2 clients each week for consistent pipeline flow.');
      insights.push('Track response rates for both pipelines to identify which outreach messages resonate best.');
    }

    while (insights.length < 5) insights.push('Keep adding data to unlock more personalized, AI-driven insights for your pipeline.');
    return NextResponse.json({ insights: insights.slice(0, 5) });
  } catch (error) {
    console.error('Insights error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
