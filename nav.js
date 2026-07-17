class MyNavbar extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });

        shadow.innerHTML = `
        <style>
            nav {
                background: #222;
                padding: 0 60px;
                display: flex;
                gap: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            ul {    
                display: flex;
                justify-content: space-between;
                width: 20%;
                list-style-type: none;
            }

            #logo {
                font-size: 30px;
                color: white;
                font-weight: 700;
            }

            a {
                color: white;
                text-decoration: none;
            }

            a:hover {
                color: gold;
            }
        </style>

        <nav>
            <p id="logo">VITA</p>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/about.html">About</a></li>
                <li><a href="/templates.html">Templates</a></li>
                <li><a href="/editor.html">Editor</a></li>
            </ul>
        </nav>
        `;
    }
}

customElements.define("my-navbar", MyNavbar);