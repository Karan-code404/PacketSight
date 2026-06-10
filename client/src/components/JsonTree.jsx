import React, { useState, useEffect } from 'react';

const TreeNode = ({ name, value, path, level, expandedPaths, togglePath }) => {
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const isExpanded = expandedPaths[path] ?? (level === 0);

  const indentStyle = { paddingLeft: `${level * 16}px` };

  const handleToggle = () => {
    if (isObject) {
      togglePath(path);
    }
  };

  const renderValue = () => {
    if (value === null) {
      return <span className="text-secondary/60 font-semibold italic">null</span>;
    }
    if (typeof value === 'string') {
      return <span className="text-[#86EFAC] break-words whitespace-pre-wrap">"{value}"</span>;
    }
    if (typeof value === 'number') {
      return <span className="text-[#FCA5A5] font-mono font-semibold">{value}</span>;
    }
    if (typeof value === 'boolean') {
      return <span className="text-[#FCD34D] font-mono font-semibold">{String(value)}</span>;
    }
    if (isArray) {
      return <span className="text-secondary font-mono font-medium">{`[ ${value.length} items ]`}</span>;
    }
    return <span className="text-secondary font-mono font-medium">{`{ ${Object.keys(value).length} keys }`}</span>;
  };

  return (
    <div className="flex flex-col select-none">
      {/* Node row */}
      <div 
        onClick={handleToggle}
        className={`flex items-start gap-1 py-1 px-2 text-xs hover:bg-[#222533]/40 rounded-sm cursor-pointer transition-colors ${
          isObject ? 'font-medium' : ''
        }`}
        style={indentStyle}
      >
        {/* Simple text markers instead of icons */}
        {isObject ? (
          <span className="mt-0.5 shrink-0 text-secondary hover:text-primary font-mono text-[9px] w-5 text-center">
            {isExpanded ? '[-]' : '[+]'}
          </span>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        {/* Key name */}
        {name && (
          <>
            <span className="text-accent font-mono truncate max-w-[200px]" title={name}>{name}</span>
            <span className="text-secondary">: </span>
          </>
        )}

        {/* Value preview */}
        <div className="flex-1 truncate">{renderValue()}</div>
      </div>

      {/* Children elements */}
      {isObject && isExpanded && (
        <div className="flex flex-col">
          {isArray ? (
            value.map((item, idx) => (
              <TreeNode
                key={idx}
                name={`[${idx}]`}
                value={item}
                path={`${path}[${idx}]`}
                level={level + 1}
                expandedPaths={expandedPaths}
                togglePath={togglePath}
              />
            ))
          ) : (
            Object.entries(value).map(([key, val]) => (
              <TreeNode
                key={key}
                name={key}
                value={val}
                path={`${path}.${key}`}
                level={level + 1}
                expandedPaths={expandedPaths}
                togglePath={togglePath}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const JsonTree = ({ data }) => {
  const [expandedPaths, setExpandedPaths] = useState({});

  useEffect(() => {
    setExpandedPaths({ root: true });
  }, [data]);

  const togglePath = (path) => {
    setExpandedPaths((prev) => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const getAllObjectPaths = (obj, currentPath = 'root') => {
    let paths = {};
    if (obj === null || typeof obj !== 'object') return paths;
    
    paths[currentPath] = true;
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => {
        Object.assign(paths, getAllObjectPaths(item, `${currentPath}[${idx}]`));
      });
    } else {
      Object.entries(obj).forEach(([key, val]) => {
        Object.assign(paths, getAllObjectPaths(val, `${currentPath}.${key}`));
      });
    }
    return paths;
  };

  const handleExpandAll = () => {
    const paths = getAllObjectPaths(data, 'root');
    setExpandedPaths(paths);
  };

  const handleCollapseAll = () => {
    setExpandedPaths({});
  };

  return (
    <div className="border border-border rounded-btn bg-[#0F1117] p-4 flex flex-col gap-3 relative">
      {/* Controls */}
      <div className="flex justify-end gap-2 text-[10px] font-semibold uppercase tracking-wider">
        <button 
          type="button"
          onClick={handleExpandAll}
          className="px-2.5 py-1.5 bg-panel border border-border hover:border-accent text-secondary hover:text-primary rounded-btn transition-colors font-mono"
        >
          Expand All
        </button>
        <button 
          type="button"
          onClick={handleCollapseAll}
          className="px-2.5 py-1.5 bg-panel border border-border hover:border-accent text-secondary hover:text-primary rounded-btn transition-colors font-mono"
        >
          Collapse All
        </button>
      </div>

      {/* Tree list */}
      <div className="overflow-x-auto max-h-[380px] font-mono leading-relaxed">
        <TreeNode
          name=""
          value={data}
          path="root"
          level={0}
          expandedPaths={expandedPaths}
          togglePath={togglePath}
        />
      </div>
    </div>
  );
};

export default JsonTree;
