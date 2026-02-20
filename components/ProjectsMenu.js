import React, { useState, useEffect } from 'react'
import storageService from '@/lib/services/storageService'

const ProjectsMenu = ({ onProjectOpen, onProjectCreate }) => {
  const [projects, setProjects] = useState([])
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = () => {
    setLoading(true)
    const savedProjects = storageService.getSavedProjectsList()
    setProjects(savedProjects)
    setLoading(false)
  }

  const handleDeleteProject = (projectId, e) => {
    e.stopPropagation()
    if (confirm('Вы уверены, что хотите удалить этот проект?')) {
      storageService.deleteProject(projectId)
      loadProjects()
    }
  }

  const handleOpenProject = (projectId) => {
    const project = storageService.loadProject(projectId)
    if (project && onProjectOpen) {
      onProjectOpen(project)
    }
    setShowMenu(false)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="projects-menu">
      <button
        className="projects-menu-button"
        onClick={() => setShowMenu(!showMenu)}
        title="Просмотреть сохранённые проекты"
      >
        📁 Проекты
      </button>

      {showMenu && (
        <div className="projects-dropdown">
          <div className="dropdown-content">
            <h3>Сохранённые проекты</h3>

            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                <p>Нет сохранённых проектов</p>
                <button
                  className="new-project-btn"
                  onClick={() => {
                    setShowMenu(false)
                    if (onProjectCreate) onProjectCreate()
                  }}
                >
                  Создать новый проект
                </button>
              </div>
            ) : (
              <ul className="projects-list">
                {projects.map((project) => (
                  <li key={project.id} className="project-item">
                    <div
                      className="project-info"
                      onClick={() => handleOpenProject(project.id)}
                    >
                      <div className="project-name">{project.name}</div>
                      <div className="project-date">
                        {formatDate(project.created_at)}
                      </div>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      title="Удалить проект"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              className="close-dropdown-btn"
              onClick={() => setShowMenu(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .projects-menu {
          position: relative;
        }

        .projects-menu-button {
          background: var(--color-surface);
          color: var(--color-text);
          border: 1px solid var(--color-border);
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .projects-menu-button:hover {
          background: var(--color-surface2);
          border-color: var(--color-primary);
        }

        .projects-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 8px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          min-width: 300px;
          max-height: 400px;
        }

        .dropdown-content {
          padding: 12px;
          display: flex;
          flex-direction: column;
          max-height: 380px;
          overflow: hidden;
          display: flex;
        }

        .dropdown-content h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
        }

        .loading,
        .empty-state {
          padding: 16px;
          text-align: center;
          color: var(--color-text-secondary);
          font-size: 13px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .new-project-btn {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        .new-project-btn:hover {
          opacity: 0.9;
        }

        .projects-list {
          list-style: none;
          margin: 0;
          padding: 0;
          overflow-y: auto;
          max-height: 280px;
        }

        .project-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 8px;
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          transition: background 0.2s;
        }

        .project-item:hover {
          background: var(--color-surface2);
        }

        .project-info {
          flex: 1;
          min-width: 0;
        }

        .project-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .project-date {
          font-size: 11px;
          color: var(--color-text-secondary);
          margin-top: 2px;
        }

        .delete-btn {
          background: transparent;
          color: var(--color-error);
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px 8px;
          margin-left: 8px;
          transition: all 0.2s;
        }

        .delete-btn:hover {
          color: white;
          background: var(--color-error);
          border-radius: 3px;
        }

        .close-dropdown-btn {
          background: var(--color-surface2);
          color: var(--color-text);
          border: 1px solid var(--color-border);
          padding: 6px 12px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
          margin-top: 8px;
          width: 100%;
          font-weight: 500;
          transition: background 0.2s;
        }

        .close-dropdown-btn:hover {
          background: var(--color-border);
        }
      `}</style>
    </div>
  )
}

export default ProjectsMenu
