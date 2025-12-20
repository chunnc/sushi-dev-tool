import './github-handler.css';

// Check if the GitHub comment fix feature is enabled
async function isFeatureEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['features/github-comment-fix'], (result) => {
      const enabled = result['features/github-comment-fix'] === 'true';
      console.log('GitHub comment fix feature enabled:', enabled);
      resolve(enabled);
    });
  });
}

// Create the fix icon button
function createFixButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'sushi-fix-button';
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
    </svg>
    <span>Fix Spelling & Grammar</span>
  `;
  button.title = 'Fix spelling and grammar with AI';
  button.type = 'button';
  
  return button;
}

// Add the fix button to a comment textarea
function addFixButtonToTextarea(textarea: HTMLTextAreaElement) {
  // Check if button already exists
  const form = textarea.closest('form, .comment-form-head, .previewable-comment-form');
  if (!form || form.querySelector('.sushi-fix-button')) {
    return;
  }

  // Find the action bar item container
  const actionBarContainer = form.querySelector('[data-target="action-bar.itemContainer"]');
  
  if (actionBarContainer) {
    // Create the action bar item wrapper
    const actionBarItem = document.createElement('div');
    actionBarItem.setAttribute('data-targets', 'action-bar.items');
    actionBarItem.setAttribute('data-view-component', 'true');
    actionBarItem.className = 'ActionBar-item';
    actionBarItem.style.visibility = 'visible';
    
    // Create the fix button
    const button = createFixButton();
    
    button.addEventListener('click', async () => {
      const text = textarea.value;
      if (!text.trim()) return;
      
      button.disabled = true;
      button.innerHTML = '<span>Fixing...</span>';
      
      try {
        // TODO: Call OpenAI API to fix the text
        console.log('Fixing text:', text);
        
        // Placeholder for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        button.innerHTML = '<span>✓ Fixed</span>';
        setTimeout(() => {
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            <span>Fix Spelling & Grammar</span>
          `;
          button.disabled = false;
        }, 2000);
      } catch (error) {
        console.error('Error fixing text:', error);
        button.innerHTML = '<span>❌ Error</span>';
        setTimeout(() => {
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            <span>Fix Spelling & Grammar</span>
          `;
          button.disabled = false;
        }, 2000);
      }
    });
    
    // Add button to the action bar item
    actionBarItem.appendChild(button);
    
    // Add the action bar item to the container
    actionBarContainer.appendChild(actionBarItem);
  }
}

// Initialize the extension
async function init() {
  const enabled = await isFeatureEnabled();
  
  if (!enabled) {
    console.log('GitHub comment fix feature is disabled');
    return;
  }

  // Add button to existing textareas
  const textareas = document.querySelectorAll<HTMLTextAreaElement>(
    'textarea.comment-form-textarea, textarea[name="comment[body]"]'
  );
  
  textareas.forEach(addFixButtonToTextarea);

  // Watch for new textareas
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          const textareas = node.querySelectorAll<HTMLTextAreaElement>(
            'textarea.comment-form-textarea, textarea[name="comment[body]"]'
          );
          textareas.forEach(addFixButtonToTextarea);
          
          if (node instanceof HTMLTextAreaElement && 
              (node.classList.contains('comment-form-textarea') || 
               node.name === 'comment[body]')) {
            addFixButtonToTextarea(node);
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('GitHub comment fix feature initialized');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
