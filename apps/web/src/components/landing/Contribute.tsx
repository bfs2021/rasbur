import SectionBar from '@/components/landing/SectionBar.js';

const REPO_URL = 'https://github.com/omanshchoudhary/rasbur';

const ACTIONS = [
    {
        title: 'Star the repository',
        body: 'Stars are how other developers find a small project like this one.',
        label: 'Star on GitHub',
        href: REPO_URL,
        primary: true,
    },
    {
        title: 'Report what it gets wrong',
        body: 'A string it decoded badly, or one it refused when it should not have. Paste it into an issue and say what you expected.',
        label: 'Open an issue',
        href: `${REPO_URL}/issues/new`,
        primary: false,
    },
    {
        title: 'Add a format',
        body: 'Every decoder is a single file. Read one, write the next, and open a pull request with a test.',
        label: 'Browse the decoders',
        href: `${REPO_URL}/tree/main/packages/decoders/src/decoders`,
        primary: false,
    },
];

export default function Contribute() {
    return (
        <section className="rb-section">
            <SectionBar path="~/contribute" fact="MIT licensed" />
            <h2 className="rb-h2">
                Open source. <span className="rb-accent">Help it read more.</span>
            </h2>
            <div className="rb-ct-grid">
                {ACTIONS.map((action) => (
                    <div key={action.title} className="rb-ct-cell">
                        <h3 className="rb-h3">{action.title}</h3>
                        <p className="rb-body">{action.body}</p>
                        <a
                            className={
                                action.primary ? 'rb-primary rb-ct-action' : 'rb-link rb-ct-action'
                            }
                            href={action.href}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {action.label}
                        </a>
                    </div>
                ))}
            </div>
        </section>
    );
}
