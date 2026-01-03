export interface SushiFixPopupProps {
  text: string;
  buttonElement: HTMLButtonElement;
  textarea: HTMLTextAreaElement;
  closePopup: () => void;
}

export function createSushiFixPopup(props: SushiFixPopupProps): HTMLDivElement {
  const { text, buttonElement, textarea, closePopup } = props;
  
  let popup = document.createElement('div');
  popup.className = 'sushi-fix-popup';
  popup.style.cssText = `
    position: absolute;
    width: 760px;
    background: #ffffff;
    border: 1px solid rgba(27, 31, 36, 0.15);
    border-radius: 12px;
    box-shadow: 0 16px 32px rgba(27, 31, 36, 0.15), 0 0 0 1px rgba(27, 31, 36, 0.05);
    z-index: 9999;
    padding: 0;
    margin-top: 8px;
    overflow: hidden;
  `;
  
  // Header
  const header = document.createElement('div');
  header.className = 'sushi-fix-popup-header';
  header.style.cssText = `
    padding: 16px 20px;
    border-bottom: 1px solid rgba(27, 31, 36, 0.1);
    background: linear-gradient(to bottom, #ffffff, #f6f8fa);
  `;
  
  const title = document.createElement('div');
  title.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #24292f;
  `;
  title.innerHTML = `
    <svg height="20" stroke-linejoin="round" viewBox="0 0 16 16" width="20" style="color: #7622D7;">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M10.268 14.0934C11.9051 13.4838 13.2303 12.2333 13.9384 10.6469C13.1192 10.7941 12.2138 10.9111 11.2469 10.9925C11.0336 12.2005 10.695 13.2621 10.268 14.0934ZM8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM8.48347 14.4823C8.32384 14.494 8.16262 14.5 8 14.5C7.83738 14.5 7.67616 14.494 7.51654 14.4823C7.5132 14.4791 7.50984 14.4759 7.50647 14.4726C7.2415 14.2165 6.94578 13.7854 6.67032 13.1558C6.41594 12.5744 6.19979 11.8714 6.04101 11.0778C6.67605 11.1088 7.33104 11.125 8 11.125C8.66896 11.125 9.32395 11.1088 9.95899 11.0778C9.80021 11.8714 9.58406 12.5744 9.32968 13.1558C9.05422 13.7854 8.7585 14.2165 8.49353 14.4726C8.49016 14.4759 8.4868 14.4791 8.48347 14.4823ZM11.4187 9.72246C12.5137 9.62096 13.5116 9.47245 14.3724 9.28806C14.4561 8.87172 14.5 8.44099 14.5 8C14.5 7.55901 14.4561 7.12828 14.3724 6.71194C13.5116 6.52755 12.5137 6.37904 11.4187 6.27753C11.4719 6.83232 11.5 7.40867 11.5 8C11.5 8.59133 11.4719 9.16768 11.4187 9.72246ZM10.1525 6.18401C10.2157 6.75982 10.25 7.36805 10.25 8C10.25 8.63195 10.2157 9.24018 10.1525 9.81598C9.46123 9.85455 8.7409 9.875 8 9.875C7.25909 9.875 6.53877 9.85455 5.84749 9.81598C5.7843 9.24018 5.75 8.63195 5.75 8C5.75 7.36805 5.7843 6.75982 5.84749 6.18401C6.53877 6.14545 7.25909 6.125 8 6.125C8.74091 6.125 9.46123 6.14545 10.1525 6.18401ZM11.2469 5.00748C12.2138 5.08891 13.1191 5.20593 13.9384 5.35306C13.2303 3.7667 11.9051 2.51622 10.268 1.90662C10.695 2.73788 11.0336 3.79953 11.2469 5.00748ZM8.48347 1.51771C8.4868 1.52089 8.49016 1.52411 8.49353 1.52737C8.7585 1.78353 9.05422 2.21456 9.32968 2.84417C9.58406 3.42562 9.80021 4.12856 9.95899 4.92219C9.32395 4.89118 8.66896 4.875 8 4.875C7.33104 4.875 6.67605 4.89118 6.04101 4.92219C6.19978 4.12856 6.41594 3.42562 6.67032 2.84417C6.94578 2.21456 7.2415 1.78353 7.50647 1.52737C7.50984 1.52411 7.51319 1.52089 7.51653 1.51771C7.67615 1.50597 7.83738 1.5 8 1.5C8.16262 1.5 8.32384 1.50597 8.48347 1.51771ZM5.73202 1.90663C4.0949 2.51622 2.76975 3.7667 2.06159 5.35306C2.88085 5.20593 3.78617 5.08891 4.75309 5.00748C4.96639 3.79953 5.30497 2.73788 5.73202 1.90663ZM4.58133 6.27753C3.48633 6.37904 2.48837 6.52755 1.62761 6.71194C1.54392 7.12828 1.5 7.55901 1.5 8C1.5 8.44099 1.54392 8.87172 1.62761 9.28806C2.48837 9.47245 3.48633 9.62096 4.58133 9.72246C4.52807 9.16768 4.5 8.59133 4.5 8C4.5 7.40867 4.52807 6.83232 4.58133 6.27753ZM4.75309 10.9925C3.78617 10.9111 2.88085 10.7941 2.06159 10.6469C2.76975 12.2333 4.0949 13.4838 5.73202 14.0934C5.30497 13.2621 4.96639 12.2005 4.75309 10.9925Z" fill="currentColor"></path>
    </svg>
    <span>AI Text Review</span>
  `;
  
  header.appendChild(title);
  
  // Content area
  const content = document.createElement('div');
  content.className = 'sushi-fix-popup-content';
  content.style.cssText = `
    padding: 20px;
  `;
  
  // Label
  const label = document.createElement('div');
  label.style.cssText = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #57606a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  `;
  label.textContent = 'Original Text';
  
  // Text display area
  const textArea = document.createElement('div');
  textArea.className = 'sushi-fix-popup-text';
  textArea.style.cssText = `
    min-height: 120px;
    max-height: 400px;
    overflow-y: auto;
    padding: 16px;
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #24292f;
    white-space: pre-wrap;
    word-wrap: break-word;
  `;
  textArea.textContent = text;
  
  content.appendChild(label);
  content.appendChild(textArea);
  
  // Footer with buttons
  const footer = document.createElement('div');
  footer.className = 'sushi-fix-popup-footer';
  footer.style.cssText = `
    padding: 16px 20px;
    border-top: 1px solid rgba(27, 31, 36, 0.1);
    background: #f6f8fa;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  `;
  
  // Discard button
  const discardButton = document.createElement('button');
  discardButton.className = 'sushi-fix-popup-discard';
  discardButton.textContent = 'Discard';
  discardButton.style.cssText = `
    padding: 8px 20px;
    background: #ffffff;
    color: #24292f;
    border: 1px solid rgba(27, 31, 36, 0.15);
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 1px 0 rgba(27, 31, 36, 0.04);
  `;
  discardButton.onmouseover = () => {
    discardButton.style.background = '#f3f4f6';
    discardButton.style.borderColor = 'rgba(27, 31, 36, 0.25)';
  };
  discardButton.onmouseout = () => {
    discardButton.style.background = '#ffffff';
    discardButton.style.borderColor = 'rgba(27, 31, 36, 0.15)';
  };
  discardButton.onclick = () => {
    closePopup();
  };
  
  // Replace button
  const replaceButton = document.createElement('button');
  replaceButton.className = 'sushi-fix-popup-replace';
  replaceButton.textContent = 'Replace';
  replaceButton.style.cssText = `
    padding: 8px 20px;
    background: linear-gradient(to bottom, #7622D7, #6b1fc7);
    color: #ffffff;
    border: 1px solid rgba(118, 34, 215, 0.3);
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 1px 0 rgba(27, 31, 36, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  `;
  replaceButton.onmouseover = () => {
    replaceButton.style.background = 'linear-gradient(to bottom, #8b3ae5, #7622D7)';
    replaceButton.style.transform = 'translateY(-1px)';
    replaceButton.style.boxShadow = '0 2px 4px rgba(118, 34, 215, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
  };
  replaceButton.onmouseout = () => {
    replaceButton.style.background = 'linear-gradient(to bottom, #7622D7, #6b1fc7)';
    replaceButton.style.transform = 'translateY(0)';
    replaceButton.style.boxShadow = '0 1px 0 rgba(27, 31, 36, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
  };
  replaceButton.onclick = () => {
    textarea.value = 'hello world';
    closePopup();
  };
  
  footer.appendChild(discardButton);
  footer.appendChild(replaceButton);
  
  popup.appendChild(header);
  popup.appendChild(content);
  popup.appendChild(footer);
  
  // Position popup below the button
  positionPopup(popup, buttonElement);
  
  // Run initialization function once when popup is displayed
  initializePopup();
  
  return popup;
}

function initializePopup() {
  console.log('SushiFixPopup is now displayed');
}

function positionPopup(popup: HTMLDivElement, button: HTMLButtonElement) {
  const buttonRect = button.getBoundingClientRect();
  popup.style.top = `${buttonRect.bottom + window.scrollY}px`;
  popup.style.left = `${buttonRect.left + window.scrollX - 48}px`;
}
