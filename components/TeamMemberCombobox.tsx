import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { ChevronDownIcon, MagnifyingGlassIcon, XIcon, UserPlusIcon } from './icons';
import { useI18n } from '../contexts/i18n';

interface TeamMemberComboboxProps {
  availableUsers: User[];
  onSelectUser: (userId: string) => void;
  placeholder?: string;
}

const normalizeStr = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const TeamMemberCombobox: React.FC<TeamMemberComboboxProps> = ({
  availableUsers,
  onSelectUser,
  placeholder,
}) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const defaultPlaceholder = placeholder || t('admin.teams.addMemberPlaceholder') || t('admin.teams.addMember');

  // Filter users based on query
  const filteredUsers = availableUsers.filter((user) => {
    if (!searchTerm.trim()) return true;
    const query = normalizeStr(searchTerm);
    const firstName = normalizeStr(user.firstName || '');
    const lastName = normalizeStr(user.lastName || '');
    const fullName1 = `${firstName} ${lastName}`;
    const fullName2 = `${lastName} ${firstName}`;
    const email = normalizeStr(user.email || '');

    return (
      firstName.includes(query) ||
      lastName.includes(query) ||
      fullName1.includes(query) ||
      fullName2.includes(query) ||
      email.includes(query)
    );
  });

  // Handle outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Reset highlighted index on filter changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm, isOpen]);

  // Keep highlighted item visible
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (user: User) => {
    onSelectUser(user.id);
    setSearchTerm('');
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredUsers.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filteredUsers.length - 1)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredUsers.length > 0 && filteredUsers[highlightedIndex]) {
        handleSelect(filteredUsers[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  if (availableUsers.length === 0) {
    return (
      <div className="mt-1 flex items-center text-xs text-slate-400 italic bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <UserPlusIcon className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
        <span>{t('admin.teams.allUsersAdded')}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative mt-2 w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <MagnifyingGlassIcon className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={defaultPlaceholder}
          className="block w-full pl-9 pr-16 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 space-x-0.5">
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Effacer"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            title={t('admin.teams.addMember')}
          >
            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 max-h-64 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-500 text-center">
              {t('admin.teams.noUserFound', { query: searchTerm })}
            </div>
          ) : (
            <ul ref={listRef} className="divide-y divide-slate-100">
              {filteredUsers.map((user, idx) => {
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    key={user.id}
                    onClick={() => handleSelect(user)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isHighlighted ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-7 h-7 rounded-full border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="pl-2 shrink-0">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                        isHighlighted ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <UserPlusIcon className="w-3 h-3 mr-1" />
                        {t('common.add')}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamMemberCombobox;
