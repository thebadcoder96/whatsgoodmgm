import { useDocumentOperation, type DocumentActionComponent } from 'sanity'

export const ApproveAction: DocumentActionComponent = (props) => {
  const { patch, publish } = useDocumentOperation(props.id, props.type)
  const doc = (props.draft ?? props.published) as { status?: string } | null
  if (props.type !== 'event' || doc?.status !== 'pending') return null
  return {
    label: 'Approve ✓',
    tone: 'positive',
    onHandle: () => {
      patch.execute([{ set: { status: 'approved' } }])
      publish.execute()
      props.onComplete()
    },
  }
}
