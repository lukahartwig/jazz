import { CoID, RawCoValue } from "cojson";
import { useAccount } from "jazz-react-core";
import React, { useState } from "react";
import { Breadcrumbs } from "./breadcrumbs.js";
import { PageStack } from "./page-stack.js";
import { usePagePath } from "./use-page-path.js";

type Position =
  | "bottom right"
  | "bottom left"
  | "top right"
  | "top left"
  | "right"
  | "left";

export function JazzInspector({
  position = "right",
  hidden,
}: { position?: Position; hidden?: boolean }) {
  const [open, setOpen] = useState(false);
  const [coValueId, setCoValueId] = useState<CoID<RawCoValue> | "">("");
  const { path, addPages, goToIndex, goBack, setPage } = usePagePath();

  const { me } = useAccount();
  const localNode = me._raw.core.node;

  if (hidden) return;

  const handleCoValueIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (coValueId) {
      setPage(coValueId);
    }
  };

  const positionStyles = {
    "bottom right": {
      bottom: 0,
      right: 0,
    },
    "bottom left": {
      bottom: 0,
      left: 0,
    },
    "top right": {
      top: 0,
      right: 0,
    },
    "top left": {
      top: 0,
      left: 0,
    },
    right: {
      right: 0,
      top: "50%",
      transform: "translateY(-50%)",
    },
    left: {
      left: 0,
      top: "50%",
      transform: "translateY(-50%)",
    },
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          margin: "1rem",
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "0.5rem",
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          ...positionStyles[position],
        }}
      >
        <svg
          style={{
            width: "1.5rem",
            height: "1.5rem",
            position: "relative",
            left: "-1px",
            top: "1px",
          }}
          xmlns="http://www.w3.org/2000/svg"
          width="119"
          height="115"
          viewBox="0 0 119 115"
          fill="none"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M118.179 23.8277V0.167999C99.931 7.5527 79.9854 11.6192 59.0897 11.6192C47.1466 11.6192 35.5138 10.2908 24.331 7.7737V30.4076V60.1508C23.2955 59.4385 22.1568 58.8458 20.9405 58.3915C18.1732 57.358 15.128 57.0876 12.1902 57.6145C9.2524 58.1414 6.5539 59.4419 4.4358 61.3516C2.3178 63.2613 0.875401 65.6944 0.291001 68.3433C-0.293399 70.9921 0.00659978 73.7377 1.1528 76.2329C2.2991 78.728 4.2403 80.861 6.7308 82.361C9.2214 83.862 12.1495 84.662 15.1448 84.662C15.6054 84.662 15.8365 84.662 16.0314 84.659C26.5583 84.449 35.042 75.9656 35.2513 65.4386C35.2534 65.3306 35.2544 65.2116 35.2548 65.0486L35.2552 64.7149V64.5521V61.0762V32.1993C43.0533 33.2324 51.0092 33.7656 59.0897 33.7656C59.6696 33.7656 60.2489 33.7629 60.8276 33.7574V89.696C59.792 88.983 58.6533 88.391 57.437 87.936C54.6697 86.903 51.6246 86.632 48.6867 87.159C45.7489 87.686 43.0504 88.987 40.9323 90.896C38.8143 92.806 37.3719 95.239 36.7875 97.888C36.2032 100.537 36.5031 103.283 37.6494 105.778C38.7956 108.273 40.7368 110.405 43.2273 111.906C45.7179 113.406 48.646 114.207 51.6414 114.207C52.1024 114.207 52.3329 114.207 52.5279 114.203C63.0548 113.994 71.5385 105.51 71.7478 94.983C71.7517 94.788 71.7517 94.558 71.7517 94.097V90.621V33.3266C83.962 32.4768 95.837 30.4075 107.255 27.2397V59.9017C106.219 59.1894 105.081 58.5966 103.864 58.1424C101.097 57.1089 98.052 56.8384 95.114 57.3653C92.176 57.8922 89.478 59.1927 87.36 61.1025C85.242 63.0122 83.799 65.4453 83.215 68.0941C82.631 70.743 82.931 73.4886 84.077 75.9837C85.223 78.4789 87.164 80.612 89.655 82.112C92.145 83.612 95.073 84.413 98.069 84.413C98.53 84.413 98.76 84.413 98.955 84.409C109.482 84.2 117.966 75.7164 118.175 65.1895C118.179 64.9945 118.179 64.764 118.179 64.3029V60.8271V23.8277Z"
            fill="#3313F7"
          />
        </svg>
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        backgroundColor: "white",
        borderTop: "1px solid #e5e7eb",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <Breadcrumbs path={path} onBreadcrumbClick={goToIndex} />
        <button onClick={() => setOpen(false)}>Close</button>
      </div>

      <PageStack
        path={path}
        node={localNode}
        goBack={goBack}
        addPages={addPages}
      >
        <form
          onSubmit={handleCoValueIdSubmit}
          aria-hidden={path.length !== 0}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            height: "100%",
            width: "100%",
            marginBottom: "5rem",
            transition: "all 150ms",
            opacity: path.length > 0 ? 0 : 1,
            transform:
              path.length > 0 ? "translateY(-0.5rem) scale(0.95)" : "none",
          }}
        >
          <fieldset
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: "0.875rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.875rem",
                fontWeight: 500,
                color: "#030712",
                textAlign: "center",
                marginBottom: "1rem",
              }}
            >
              Jazz CoValue Inspector
            </h2>
            <input
              style={{
                border: "1px solid #e5e7eb",
                padding: "1rem",
                borderRadius: "0.5rem",
                minWidth: "21rem",
                fontFamily: "monospace",
              }}
              placeholder="co_z1234567890abcdef123456789"
              value={coValueId}
              onChange={(e) => setCoValueId(e.target.value as CoID<RawCoValue>)}
            />
            <button
              type="submit"
              style={{
                backgroundColor: "rgb(99 102 241)",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "rgba(99 102 241, 0.8)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "rgb(99 102 241)")
              }
            >
              Inspect
            </button>
            <hr />
            <button
              type="button"
              style={{
                border: "1px solid #e5e7eb",
                display: "inline-block",
                padding: "0.375rem 0.5rem",
                color: "black",
                borderRadius: "0.375rem",
              }}
              onClick={() => {
                setCoValueId(me._raw.id);
                setPage(me._raw.id);
              }}
            >
              Inspect My Account
            </button>
          </fieldset>
        </form>
      </PageStack>
    </div>
  );
}
