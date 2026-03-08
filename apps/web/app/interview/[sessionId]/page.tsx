import { InterviewRoom } from "@/components/interview/interview-room"

export default async function InterviewRoomPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  return <InterviewRoom sessionId={sessionId} />
}
