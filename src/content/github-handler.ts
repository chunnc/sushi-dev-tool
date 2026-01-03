import './github-handler.css';
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

// Initialize the extension
async function init() {
  const enabled = await isFeatureEnabled();
  
  if (!enabled) {
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
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
