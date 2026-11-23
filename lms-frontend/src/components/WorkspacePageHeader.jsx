export default function WorkspacePageHeader({ title, description, eyebrow, actions }) {
    return <header className="product-page-header">
        <div>{eyebrow && <p className="product-page-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="product-page-description">{description}</p>}</div>
        {actions && <div className="product-page-actions">{actions}</div>}
    </header>;
}
