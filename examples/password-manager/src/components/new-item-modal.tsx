import { useAccount } from "jazz-react";
import { CoPlainText } from "jazz-tools";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Folder } from "../1_schema";
import { PasswordItemFormValues } from "../types";
import { Alert, AlertDescription } from "./alert";
import BaseModal from "./base-modal";
import Button from "./button";

type PasswordItemFormStrings = {
  name: string;
  username?: string;
  password: string;
  uri?: string;
  deleted: boolean;
  folderID: string; // Use folder id for the form, not the object
};

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: PasswordItemFormValues;
  onSave: (item: PasswordItemFormValues) => void;
  folders: Folder[];
  selectedFolder: Folder | undefined;
}

const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  initialValues,
  onSave,
  folders,
  selectedFolder,
}) => {
  const { me } = useAccount();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    clearErrors,
  } = useForm<PasswordItemFormStrings>({
    defaultValues: initialValues
      ? {
          name: initialValues.name?.toString() ?? "",
          username: initialValues.username?.toString() ?? "",
          password: initialValues.password?.toString() ?? "",
          uri: initialValues.uri?.toString() ?? "",
          deleted: initialValues.deleted ?? false,
          folderID: initialValues.folder?.id ?? selectedFolder?.id ?? "",
        }
      : {
          name: "",
          username: "",
          password: "",
          uri: "",
          deleted: false,
          folderID: selectedFolder?.id ?? "",
        },
  });
  console.log("initialValues", initialValues);
  console.log("selectedFolder", selectedFolder?.id);

  useEffect(() => {
    if (initialValues) {
      setValue("name", initialValues.name?.toString() ?? "");
      setValue("username", initialValues.username?.toString() ?? "");
      setValue("password", initialValues.password?.toString() ?? "");
      setValue("uri", initialValues.uri?.toString() ?? "");
      setValue("deleted", initialValues.deleted ?? false);
      setValue(
        "folderID",
        initialValues.folder?.id ?? selectedFolder?.id ?? "",
      );
    } else {
      reset();
      setValue("folderID", selectedFolder?.id ?? "");
    }
    clearErrors();
  }, [initialValues, setValue, reset, selectedFolder]);

  const onSubmit = (data: PasswordItemFormStrings) => {
    const selectedFolderObj =
      folders.find((folder) => folder.id === data.folderID) ?? selectedFolder;
    const owner = selectedFolderObj?._owner || me;
    const toSave = {
      name: CoPlainText.create(data.name, { owner }),
      username: data.username
        ? CoPlainText.create(data.username, { owner })
        : undefined,
      password: CoPlainText.create(data.password, { owner }),
      uri: data.uri ? CoPlainText.create(data.uri, { owner }) : undefined,
      deleted: data.deleted ?? false,
      folder: selectedFolderObj ?? null,
    };
    onSave(toSave);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialValues ? "Edit Password" : "Add New Password"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <input
            type="text"
            {...register("name", { required: "Name is required" })}
            id="name"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.name && (
            <Alert variant="destructive">
              <AlertDescription>{errors.name.message}</AlertDescription>
            </Alert>
          )}
        </div>
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <input
            type="text"
            {...register("username")}
            id="username"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters long",
              },
            })}
            id="password"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.password && (
            <Alert variant="destructive">
              <AlertDescription>{errors.password.message}</AlertDescription>
            </Alert>
          )}
        </div>
        <div>
          <label
            htmlFor="uri"
            className="block text-sm font-medium text-gray-700"
          >
            URI
          </label>
          <input
            type="url"
            {...register("uri", {
              validate: (value) =>
                !value ||
                value.startsWith("http://") ||
                value.startsWith("https://") ||
                "URI must start with http:// or https://",
            })}
            id="uri"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.uri && (
            <Alert variant="destructive">
              <AlertDescription>{errors.uri.message}</AlertDescription>
            </Alert>
          )}
        </div>
        <div>
          <label
            htmlFor="folder"
            className="block text-sm font-medium text-gray-700"
          >
            Folder
          </label>
          <select
            {...register("folderID", { required: "Must select a folder" })}
            id="folderID"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select a folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name?.toString()}
              </option>
            ))}
          </select>
          {errors.folderID && (
            <Alert variant="destructive">
              <AlertDescription>{errors.folderID.message}</AlertDescription>
            </Alert>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initialValues ? "Update" : "Save"}</Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default NewItemModal;
