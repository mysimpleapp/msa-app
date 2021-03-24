export function showMsaAppEditor(visible) {
    if(visible === undefined) visible = true
    const editorParentEl = document.querySelector("#msa-app-editor")
    editorParentEl.style.display = visible ? "" : "none"
}

export function setMsaAppEditor(editorEl) {
    showMsaAppEditor(true)
    const editorParentEl = document.querySelector("#msa-app-editor")
    editorParentEl.innerHTML = ""
    if(editorEl) {
        editorParentEl.appendChild(editorEl)
    }
}