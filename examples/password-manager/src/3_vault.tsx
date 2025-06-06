/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import Button from "./components/button";
import InviteModal from "./components/invite-modal";
import NewItemModal from "./components/new-item-modal";
import Table from "./components/table";

import { useAccount } from "jazz-react";
import { Loaded } from "jazz-tools";
import { useNavigate, useParams } from "react-router-dom";
import { Folder, PasswordItem, PasswordManagerAccount } from "./1_schema";
import {
  addSharedFolder,
  createFolder,
  deleteItem,
  saveItem,
  updateItem,
} from "./4_actions";
import { Alert, AlertDescription } from "./components/alert";
import { PasswordItemFormValues } from "./types";

const VaultPage: React.FC = () => {
  const { me, logOut } = useAccount(PasswordManagerAccount, {
    resolve: {
      root: {
        folders: {
          $each: {
            items: {
              $each: true,
            },
          },
        },
      },
    },
  });
  const sharedFolderId = useParams<{ sharedFolderId: string }>().sharedFolderId;

  const navigate = useNavigate();

  useEffect(() => {
    if (!sharedFolderId) return;

    const me = PasswordManagerAccount.getMe();

    addSharedFolder(sharedFolderId, me).then(() => {
      navigate("/vault");
    });

    // We want to trigger this only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = me?.root.folders.flatMap(
    (folder) =>
      folder?.items?.filter(
        (item): item is Exclude<typeof item, null> => !!item,
      ) || [],
  );
  const folders = me?.root.folders;

  const [selectedFolder, setSelectedFolder] = useState<
    Loaded<typeof Folder> | undefined
  >();
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isNewFolderInputVisible, setIsNewFolderInputVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingItem, setEditingItem] = useState<Loaded<
    typeof PasswordItem
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = selectedFolder
    ? items?.filter(
        (item) => item?.folder?.name === selectedFolder.name && !item.deleted,
      )
    : items?.filter((item) => !item?.deleted);

  const handleSaveNewItem = async (newItem: PasswordItemFormValues) => {
    try {
      saveItem(newItem);
    } catch (err: any) {
      setError("Failed to save new item. Please try again.");
      throw new Error(err);
    }
  };

  const handleUpdateItem = async (updatedItem: PasswordItemFormValues) => {
    if (!editingItem) return;
    try {
      updateItem(editingItem, updatedItem);
      setEditingItem(null);
    } catch (err: any) {
      setError("Failed to update item. Please try again.");
      throw new Error(err);
    }
  };

  const handleDeleteItem = async (item: Loaded<typeof PasswordItem>) => {
    try {
      deleteItem(item);
    } catch (err) {
      setError("Failed to delete item. Please try again.");
    }
  };

  const handleCreateFolder = async () => {
    if (!me) return;
    if (newFolderName) {
      try {
        const newFolder = createFolder(newFolderName, me);
        setNewFolderName("");
        setIsNewFolderInputVisible(false);
        setSelectedFolder(newFolder);
      } catch (err) {
        setError("Failed to create folder. Please try again.");
      }
    }
  };

  const handleDeleteFolder = async () => {
    if (!me) return;
    try {
      const selectedFolderIndex = me.root.folders.findIndex(
        (folder) => folder?.id === selectedFolder?.id,
      );
      if (selectedFolderIndex !== undefined && selectedFolderIndex > -1)
        me.root.folders.splice(selectedFolderIndex, 1);
    } catch (err) {
      setError("Failed to create folder. Please try again.");
    }
  };

  const handleLogout = async () => {
    if (!me) return;
    try {
      logOut();
    } catch (err) {
      setError("Failed to logout. Please try again.");
    }
  };

  const columns = [
    { header: "Name", accessor: "name" as const },
    { header: "Username", accessor: "username" as const },
    { header: "URI", accessor: "uri" as const },
    {
      header: "Actions",
      accessor: "id" as const,
      render: (item: Loaded<typeof PasswordItem>) => (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigator.clipboard.writeText(item.password)}>
            Copy Password
          </Button>
          <Button
            onClick={() => setEditingItem(item)}
            disabled={!me?.canWrite(item)}
          >
            Edit
          </Button>
          <Button
            onClick={() => handleDeleteItem(item)}
            variant="danger"
            disabled={!me?.canWrite(item)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="container flex justify-between items-center">
        <h1 className="text-3xl font-bold mb-8">Password Vault</h1>
        <Button onClick={handleLogout} variant="secondary">
          Logout
        </Button>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            key={"folder-all"}
            onClick={() => setSelectedFolder(undefined)}
            variant={!selectedFolder ? "primary" : "secondary"}
          >
            All
          </Button>
          {folders?.map((folder) => (
            <Button
              key={folder.id}
              onClick={() => setSelectedFolder(folder)}
              variant={
                selectedFolder?.name === folder?.name ? "primary" : "secondary"
              }
            >
              {folder?.name}
            </Button>
          ))}
          {isNewFolderInputVisible ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="border rounded px-2 py-1"
              />
              <Button onClick={handleCreateFolder}>Save</Button>
            </div>
          ) : (
            <Button onClick={() => setIsNewFolderInputVisible(true)}>
              New Folder
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsNewItemModalOpen(true)}
            disabled={!selectedFolder || !me?.canWrite(selectedFolder)}
          >
            New Item
          </Button>
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            disabled={!selectedFolder || !me?.canWrite(selectedFolder)}
          >
            Share Folder
          </Button>
          <Button onClick={handleDeleteFolder} disabled={!selectedFolder}>
            Delete Folder
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table data={filteredItems} columns={columns} />
      </div>
      {folders ? (
        <NewItemModal
          isOpen={isNewItemModalOpen || !!editingItem}
          onClose={() => {
            setIsNewItemModalOpen(false);
            setEditingItem(null);
          }}
          onSave={editingItem ? handleUpdateItem : handleSaveNewItem}
          folders={folders}
          selectedFolder={selectedFolder}
          initialValues={
            editingItem && editingItem.folder
              ? { ...editingItem, folder: editingItem.folder! }
              : undefined
          }
        />
      ) : null}

      {folders ? (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          selectedFolder={selectedFolder}
        />
      ) : null}
    </div>
  );
};

export default VaultPage;
