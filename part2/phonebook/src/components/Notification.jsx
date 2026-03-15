const Notification = ({ message }) => {
  if (message === null) return null;

  // message object has { text, type }
  return <div className={message.type}>{message.text}</div>;
};

export default Notification;
