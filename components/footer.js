class MyFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer class="footer">
            <a href="/">VITA</a>
        </footer>
        `;
    }
}

customElements.define("my-footer", MyFooter);