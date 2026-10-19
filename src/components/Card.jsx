export default function Card({ as: Tag = 'section', title, icon, children, className = '', ...rest }) {
  return (
    <Tag className={`card ${className}`.trim()} {...rest}>
      {title && (
        <h2 className="card_title">
          {icon}
          <span>{title}</span>
        </h2>
      )}
      {children}
    </Tag>
  );
}