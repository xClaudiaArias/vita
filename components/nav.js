class MyNavbar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav>
                <a id="logo"  href="/">*</a>
                <ul>
                    <li><a href="/about.html">About</a></li>
                    <li><a href="/templates.html">Templates</a></li>
                    <li><a href="/editor.html">Editor</a></li>
                </ul>
            </nav>
        `
    }
}

customElements.define("my-navbar", MyNavbar);