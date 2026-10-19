export default function StateEmoji({ code, size = 48 }) {
  return (
    <img
      className="state-emoji"
      src={`https://static.toss.im/2d-emojis/svg/${code}.svg`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable="false"
    />
  );
}
