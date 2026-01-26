export default function Paragraph({ text }: { text: string }) {
  return <p dangerouslySetInnerHTML={{ __html: text }} />;
}
