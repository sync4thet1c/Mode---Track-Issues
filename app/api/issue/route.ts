import { db } from '@/db'
import { issues } from '@/db/schema'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const allIssues = await db.query.issues.findMany()
    return NextResponse.json(allIssues)
  } catch (error) {
    console.error('Error fetching issues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issue' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    if (!data.title || !data.userId) {
      return NextResponse.json(
        { error: 'Title and userId are required' },
        { status: 400 }
      )
    }
    const newIssue = await db
      .insert(issues)
      .values({
        title: data.title,
        description: data.description || null,
        status: data.status || 'backlog',
        priority: data.priority || 'medium',
        userId: data.userId,
      })
      .returning()
    return NextResponse.json({message: 'Issue created successfully', issue: newIssue[0]},{status: 201})
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    )
  }
}
