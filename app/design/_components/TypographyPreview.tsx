/** Every global element style, unstyled markup only. */
export function TypographyPreview() {
  return (
    <div>
      <h1>Heading one</h1>
      <h2>Heading two</h2>
      <h3>Heading three</h3>
      <h4>Heading four</h4>
      <h5>Heading five</h5>
      <h2 lang="zh-Hant">學習工具</h2>
      <p>
        Body text in the theme&apos;s latin font, with <a href="#">a link</a>, some{" "}
        <strong>strong text</strong>, <code>inline code</code>, and hanzi inline: 你好，世界。
      </p>
      <p>
        <small>Small print for captions and notes.</small>
      </p>
      <ul>
        <li>Flashcards from class and unit sets</li>
        <li>A reader that annotates any text</li>
      </ul>
      <ol>
        <li>Write flashcards</li>
        <li>Refine them</li>
      </ol>
      <blockquote>池塘邊的榕樹上，知了在聲聲叫著夏天。</blockquote>
      <hr />
      <pre>
        <code>make refine type=class args=verbs</code>
      </pre>
    </div>
  );
}
