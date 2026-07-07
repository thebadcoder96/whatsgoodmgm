import { useDocumentOperation, type DocumentActionComponent } from 'sanity'

export const ApproveAction: DocumentActionComponent = (props) => {
  const { patch } = useDocumentOperation(props.id, props.type)
  const doc = (props.published ?? props.draft) as { status?: string } | null
  if (props.type !== 'event' || doc?.status !== 'pending') return null
  return {
    label: 'Approve ✓',
    tone: 'positive',
    onHandle: () => {
      patch.execute([{ set: { status: 'approved' } }])
      props.onComplete()
    },
  }
}
