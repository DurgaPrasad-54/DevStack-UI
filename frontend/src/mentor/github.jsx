import React from "react";
import "./github.css";
import { Copy } from "lucide-react";

export default function Github(props) {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard: " + text);
  };

  return (
    <div className="repo-card">
      <div className="repo-header">
        <img
          src={props.owner.avatar_url}
          alt={props.owner.login}
          className="repo-avatar"
        />
        <div className="repo-info">
          <h2 className="repo-title">{props.name}</h2>
          <p className="repo-name">{props.owner.login}</p>
          <span className="repo-badge">
            {props.private ? "Private" : "Public"}
          </span>
        </div>
      </div>

      <p className="repo-creation">
        This Repository was Created on{" "}
        {new Date(props.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}{" "}
        by {props.owner.login}.
      </p>

      <div className="repo-link-container">
        <div className="repo-item">
          <a
            href={props.html_url}
            className="repo-link"
            target="_blank"
            rel="noreferrer"
          >
            View Repo
          </a>
          <button
            className="copy-button"
            onClick={() => copyToClipboard(props.html_url)}
          >
            <Copy size={18} />
          </button>
        </div>

        <div className="repo-item">
          <a
            href={`git clone ${props.clone_url}`}
            className="clone-link"
            onClick={(e) => {
              e.preventDefault();
              copyToClipboard(`git clone ${props.clone_url}`);
            }}
          >
            Clone Repo
          </a>
          <button
            className="copy-button"
            onClick={() => copyToClipboard(`git clone ${props.clone_url}`)}
          >
            <Copy size={18} />
          </button>
        </div>
      </div>

      <div className="repo-stats">
        <div className="repo-language">
          {props.language && <span className="repo-tag">{props.language}</span>}
        </div>
        <div className="repo-metrics">
          <span>{props.stargazers_count} Stars</span>
          <span>{props.watchers_count} Watchers</span>
          <span>{props.open_issues} Issues</span>
        </div>
      </div>
    </div>
  );
}
