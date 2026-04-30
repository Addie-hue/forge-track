import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export function SearchCombobox({
  items = [],
  value = null,
  onChange,
  placeholder = 'Search students...',
  label,
  className = '',
  renderItem = (item) => item.label || item.name || '',
  filterItem = (item, query) => {
    const q = query.toLowerCase();
    return (item.label || item.name || '').toLowerCase().includes(q) || 
           (item.usn || '').toLowerCase().includes(q);
  }
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  
  const filteredItems = query === '' 
    ? items 
    : items.filter(item => filterItem(item, query));

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = value ? renderItem(value) : '';

  return (
    <div className={`relative flex flex-col gap-2 ${className}`} ref={containerRef}>
      {label && <label className="text-label uppercase text-fg-secondary">{label}</label>}
      
      <div 
        className={`
          flex items-center w-full h-11 px-4 rounded-md bg-surface-inset border
          transition-all duration-200 cursor-text
          ${isOpen ? 'border-accent-glow shadow-focus' : 'border-border hover:border-border-strong'}
        `}
        onClick={() => setIsOpen(true)}
      >
        <Search className="w-4 h-4 text-fg-tertiary mr-2 flex-shrink-0" />
        <input
          type="text"
          className="w-full bg-transparent text-fg-primary text-body placeholder:text-fg-tertiary focus:outline-none"
          placeholder={displayValue || placeholder}
          value={isOpen ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <ChevronDown className={`w-4 h-4 text-fg-tertiary flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-64 overflow-y-auto bg-surface-raised border border-border rounded-md shadow-raised z-50 animate-scale-in origin-top">
          {filteredItems.length === 0 ? (
            <div className="p-4 text-body text-fg-tertiary text-center">No results found.</div>
          ) : (
            <ul className="py-2">
              {filteredItems.map((item, i) => {
                const isSelected = value && item.id === value.id;
                return (
                  <li
                    key={item.id || i}
                    className={`
                      px-4 py-2.5 flex items-center justify-between cursor-pointer
                      transition-colors text-body
                      ${isSelected ? 'bg-surface text-fg-primary' : 'text-fg-secondary hover:bg-surface hover:text-fg-primary'}
                    `}
                    onClick={() => {
                      onChange(item);
                      setQuery('');
                      setIsOpen(false);
                    }}
                  >
                    <span>{renderItem(item)}</span>
                    {isSelected && <Check className="w-4 h-4 text-accent-glow" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
