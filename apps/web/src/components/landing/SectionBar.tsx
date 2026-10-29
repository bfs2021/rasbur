type SectionBarProps = {
    path: string;
    fact: string;
};

export default function SectionBar({ path, fact }: SectionBarProps) {
    return (
        <div className="rb-bar">
            <span className="rb-bar-path">{path}</span>
            <span className="rb-bar-fact">{fact}</span>
        </div>
    );
}
