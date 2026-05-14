import React, { useState } from "react";
import {
    DotsThreeVerticalIcon,
    PencilIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
    useDeleteProviderModelMutation,
    useGetProviderModelsQuery,
} from "@/shared/store/features/api/roundhouseApi";
import type { ProviderListItem } from "@/shared/types/entities";
import { EditModelModal } from "./edit-model-modal";

interface ProviderModelsModalProps {
    provider: ProviderListItem;
    onClose: () => void;
}

export function ProviderModelsModal({
    provider,
    onClose,
}: ProviderModelsModalProps) {
    const { data: models = [], isLoading } = useGetProviderModelsQuery(
        provider.id,
    );
    const [editModel, setEditModel] = useState<any>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleteModel, deleteModelState] = useDeleteProviderModelMutation();

    return (
        <Modal
            onClose={onClose}
            ariaLabel={`${provider.name} models`}
            className="grid max-h-[86dvh] w-full max-w-4xl"
        >
            <div className="flex items-start justify-between gap-4 border-b border-(--color-border-primary) p-5">
                <div>
                    <h2 className="text-lg font-semibold">
                        {provider.name} Models
                    </h2>
                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                        Inspect active models and their best-fit feature tags.
                    </p>
                </div>
                <Button variant="secondary" size="sm" onClick={onClose}>
                    Close
                </Button>
            </div>
            <div
                className="grid max-h-[70dvh] gap-3 overflow-y-auto p-5 md:grid-cols-2"
                onClick={() => setOpenMenuId(null)}
            >
                {isLoading
                    ? Array.from({ length: 6 }).map((_, index) => (
                          <Skeleton key={index} className="h-28" />
                      ))
                    : models.map((model) => (
                          <div
                              key={model.id}
                              className="grid gap-3 rounded-md bg-(--color-bg-input) p-3"
                          >
                              <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                      <h3 className="truncate text-sm font-semibold">
                                          {model.name}
                                      </h3>
                                      <p className="mt-1 truncate font-mono text-xs text-(--color-text-muted)">
                                          {model.code}
                                      </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <StatusBadge status={model.status} />
                                      {provider.isCustom ? (
                                          <div className="relative">
                                              <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  aria-label="Model options"
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenMenuId(
                                                          openMenuId ===
                                                              model.id
                                                              ? null
                                                              : model.id,
                                                      );
                                                  }}
                                              >
                                                  <DotsThreeVerticalIcon
                                                      size={16}
                                                  />
                                              </Button>
                                              {openMenuId === model.id ? (
                                                  <div
                                                      className="absolute right-0 top-full z-10 mt-1 rounded-md border border-(--color-border-primary) bg-(--color-bg-primary) shadow-lg"
                                                      onClick={(e) =>
                                                          e.stopPropagation()
                                                      }
                                                  >
                                                      <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="w-full justify-start rounded-none rounded-t-md px-3"
                                                          aria-label="Edit model"
                                                          onClick={() => {
                                                              setEditModel(
                                                                  model,
                                                              );
                                                              setOpenMenuId(
                                                                  null,
                                                              );
                                                          }}
                                                      >
                                                          <PencilIcon
                                                              size={14}
                                                          />
                                                          Edit
                                                      </Button>
                                                      <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="w-full justify-start rounded-none rounded-b-md px-3 text-(--color-status-error)"
                                                          aria-label="Delete model"
                                                          disabled={
                                                              deleteModelState.isLoading
                                                          }
                                                          onClick={async () => {
                                                              if (
                                                                  !window.confirm(
                                                                      `Delete ${model.name}?`,
                                                                  )
                                                              )
                                                                  return;
                                                              try {
                                                                  await deleteModel(
                                                                      model.id,
                                                                  ).unwrap();
                                                                  toast.success(
                                                                      "Model deleted",
                                                                  );
                                                              } catch {
                                                                  toast.error(
                                                                      "Could not delete model",
                                                                  );
                                                              }
                                                              setOpenMenuId(
                                                                  null,
                                                              );
                                                          }}
                                                      >
                                                          <TrashIcon
                                                              size={14}
                                                          />
                                                          Delete
                                                      </Button>
                                                  </div>
                                              ) : null}
                                          </div>
                                      ) : null}
                                  </div>
                              </div>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                  {model.bestFor.length > 0 ? (
                                      model.bestFor.map((item) => (
                                          <Badge key={item}>{item}</Badge>
                                      ))
                                  ) : (
                                      <Badge>General</Badge>
                                  )}
                                  {model.thinking ? (
                                      <Badge>Thinking</Badge>
                                  ) : null}
                                  {model.efficiencyScore !== null ? (
                                      <Badge>
                                          {Math.round(
                                              model.efficiencyScore * 100,
                                          )}
                                          % efficient
                                      </Badge>
                                  ) : null}
                              </div>
                          </div>
                      ))}
                {!isLoading && models.length === 0 ? (
                    <p className="text-sm text-(--color-text-secondary)">
                        No active models found for this provider.
                    </p>
                ) : null}
            </div>
            {editModel ? (
                <EditModelModal
                    model={editModel}
                    onClose={() => setEditModel(null)}
                />
            ) : null}
        </Modal>
    );
}
