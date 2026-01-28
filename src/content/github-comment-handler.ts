import './github-comment-handler.css';
import { createSushiFixButton } from '../components/GithubComment/SushiFixButton';

// Check if the GitHub comment fix feature is enabled
async function isFeatureEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['features/github-comment-fix'], (result) => {
      const enabled = result['features/github-comment-fix'] === 'true';
      resolve(enabled);
    });
  });
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
    
    // Create the fix button using the component
    const button = createSushiFixButton({
      textarea
    });
    
    // Add button to the action bar item
    actionBarItem.appendChild(button);
    
    // Add the action bar item to the container as the first child
    if (actionBarContainer.firstChild) {
      actionBarContainer.insertBefore(actionBarItem, actionBarContainer.firstChild);
    } else {
      actionBarContainer.appendChild(actionBarItem);
    }
  }
}

// Add the fix button to a comment editor with formatting toolbar
function addFixButtonToTextareaV2(editorDiv: HTMLDivElement) {
  // Check if button already exists
  if (editorDiv.querySelector('.sushi-fix-button-wrapper')) {
    return;
  }

  // Find the textarea within the editor div
  const textarea = editorDiv.querySelector<HTMLTextAreaElement>(
    'textarea[aria-label="Markdown value"][placeholder="Leave a comment"]'
  );
  
  if (!textarea) {
    return;
  }

  // Find the formatting tools toolbar
  const toolbar = editorDiv.querySelector('div[aria-label="Formatting tools"][role="toolbar"]');
  
  if (toolbar) {
    // Create the fix button using the component
    const button = createSushiFixButton({
      textarea
    });
    
    // Wrap button in a container
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'sushi-fix-button-wrapper';
    buttonWrapper.appendChild(button);
    
    // Add the button as the first child of the toolbar
    if (toolbar.firstChild) {
      toolbar.insertBefore(buttonWrapper, toolbar.firstChild);
    } else {
      toolbar.appendChild(buttonWrapper);
    }
  }
}

// Find existing textareas and add fix buttons
function processExistingTextareas() {
  const textareas = document.querySelectorAll<HTMLTextAreaElement>(
    'textarea.comment-form-textarea, textarea[name="comment[body]"]'
  );
  textareas.forEach(addFixButtonToTextarea);
}

// Find editor divs with AddCommentEditor class and add fix buttons
function processExistingTextareasV2() {
  const editorDivs = document.querySelectorAll<HTMLDivElement>(
    'div[class*="AddCommentEditor"]'
  );
  editorDivs.forEach(addFixButtonToTextareaV2);
}

// Set up observer to watch for new textareas and add buttons
function setupTextareaObserver() {
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
}

// Set up observer to watch for new editor divs with AddCommentEditor class
function setupTextareaObserverV2() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          const editorDivs = node.querySelectorAll<HTMLDivElement>(
            'div[class*="AddCommentEditor"]'
          );
          editorDivs.forEach(addFixButtonToTextareaV2);
          
          if (node instanceof HTMLDivElement && 
              node.className.includes('AddCommentEditor')) {
            addFixButtonToTextareaV2(node);
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Initialize the extension
async function init() {
  const enabled = await isFeatureEnabled();
  
  if (!enabled) {
    return;
  }

  processExistingTextareas();
  setupTextareaObserver();
  processExistingTextareasV2();
  setupTextareaObserverV2();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
