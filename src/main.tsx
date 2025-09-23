import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx executing...');

const rootElement = document.getElementById("root");
console.log('Root element found:', !!rootElement);

if (!rootElement) {
  console.error('Root element not found!');
  // Показываем ошибку на странице
  document.body.innerHTML = `
    <div style="
      padding: 20px; 
      font-family: monospace; 
      color: red; 
      background: #fff; 
      border: 2px solid red; 
      margin: 20px;
      border-radius: 8px;
    ">
      <h2>❌ Ошибка инициализации</h2>
      <p><strong>Root element not found!</strong></p>
      <p>Ожидается элемент: <code>&lt;div id="root"&gt;&lt;/div&gt;</code> в index.html</p>
      <details>
        <summary>Подробности</summary>
        <p>document.body: ${document.body ? 'найден' : 'не найден'}</p>
        <p>document.readyState: ${document.readyState}</p>
        <p>All elements with id: ${Array.from(document.querySelectorAll('[id]')).map(el => el.id).join(', ') || 'нет элементов с id'}</p>
      </details>
    </div>
  `;
} else {
  console.log('Creating React root...');
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log('React app rendered successfully');
  } catch (error) {
    console.error('Render error:', error);
    // Показываем ошибку рендеринга на странице
    document.body.innerHTML = `
      <div style="
        padding: 20px; 
        font-family: monospace; 
        color: red; 
        background: #fff; 
        border: 2px solid red; 
        margin: 20px;
        border-radius: 8px;
      ">
        <h2>❌ Ошибка рендеринга React</h2>
        <p><strong>Render error:</strong></p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">${String(error)}</pre>
        <details>
          <summary>Stack trace</summary>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; font-size: 12px;">${error instanceof Error ? error.stack : 'Stack недоступен'}</pre>
        </details>
      </div>
    `;
  }
}

// Глобальная обработка ошибок
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
