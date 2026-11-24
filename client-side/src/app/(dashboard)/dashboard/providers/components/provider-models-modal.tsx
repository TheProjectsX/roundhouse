import React, { useMemo, useState } from "react";
import {
    CloudArrowDownIcon,
    DotsThreeVerticalIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    PlayIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
    useDeleteProviderModelMutation,
    useGetProviderModelsQuery,
    useTestProviderMutation,
} from "@/shared/store/features/providers/providersApi";
import { useGetKeysManagerQuery } from "@/shared/store/features/keysManager/keysManagerApi";
import type { ModelTestResult, ProviderListItem } from "@/shared/types/entities";
import { EditModelModal } from "./edit-model-modal";

interface ProviderModelsModalProps {
    provider: ProviderListItem;
    onClose: () => void;
    onFetchModels?: () => void;
}

export function ProviderModelsModal({
    provider,
    onClose,
    onFetchModels,
}: ProviderModelsModalProps) {
    const { data: models = [], isLoading } = useGetProviderModelsQuery(
        provider.id,
    );
    const [editModel, setEditModel] = useState<any>(null);
    const [confirmDeleteModel, setConfirmDeleteModel] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleteModel, deleteModelState] = useDeleteProviderModelMutation();
    const { data: vaultKeys = [] } = useGetKeysManagerQuery();
    const [selectedVaultKeyId, setSelectedVaultKeyId] = useState("");
    const [testProvider] = useTestProviderMutation();
    const [testingModelId, setTestingModelId] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<
        Record<string, ModelTestResult>
    >({});
    const [search, setSearch] = useState("");
    const [capFilter, setCapFilter] = useState<
        "all" | "tools" | "vision" | "thinking"
    >("all");

    const filteredModels = useMemo(() => {
        const term = search.trim().toLowerCase();
        return models.filter((model) => {
            if (capFilter === "tools" && model.supportsTools !== true) {
                return false;
            }
            if (capFilter === "vision" && model.supportsVision !== true) {
                return false;
            }
            if (capFilter === "thinking" && !model.thinking) {
                return false;
            }
            if (!term) return true;
            return (
                model.name.toLowerCase().includes(term) ||
                model.code.toLowerCase().includes(term) ||
                model.bestFor.some((tag) => tag.toLowerCase().includes(term))
            );
        });
    }, [models, search, capFilter]);

    const formatContextWindow = (ctx?: number | null) => {
        if (!ctx || ctx <= 0) return null;
        if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(1)}M ctx`;
        if (ctx >= 1_000) return `${Math.round(ctx / 1_000)}k ctx`;
        return `${ctx} ctx`;
    };

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
                <div className="flex flex-wrap items-center gap-2">
                    {vaultKeys.some((k) => k.active) ? (
                        <select
                            value={selectedVaultKeyId}
                            onChange={(e) =>
                                setSelectedVaultKeyId(e.target.value)
                            }
                            aria-label="Vault key for testing"
                            className="h-9 max-w-44 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-2 text-xs text-(--color-text-primary) outline-none"
                        >
                            <option value="">Auto-detect Vault Key</option>
                            {vaultKeys
                                .filter((k) => k.active)
                                .map((k) => (
                                    <option key={k.id} value={k.id}>
                                        {k.name}
                                    </option>
                                ))}
                        </select>
                    ) : null}
                    {provider.isCustom && onFetchModels ? (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onFetchModels}
                        >
                            <CloudArrowDownIcon size={15} />
                            Fetch all models
                        </Button>
                    ) : null}
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
            <div className="flex flex-col gap-3 border-b border-(--color-border-subtle) bg-(--color-bg-card) px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <MagnifyingGlassIcon
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Search ${models.length} models...`}
                        className="h-9 pl-9 text-sm"
                    />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {(
                        [
                            { id: "all", label: "All" },
                            { id: "tools", label: "Tools" },
                            { id: "vision", label: "Vision" },
                            { id: "thinking", label: "Thinking" },
                        ] as const
                    ).map((item) => (
                        <Button
                            key={item.id}
                            type="button"
                            size="sm"
                            variant={
                                capFilter === item.id ? "primary" : "secondary"
                            }
                            onClick={() => setCapFilter(item.id)}
                        >
                            {item.label}
                        </Button>
                    ))}
                </div>
            </div>
            <div
                className="grid max-h-[62dvh] gap-3 overflow-y-auto p-5 md:grid-cols-2"
                onClick={() => setOpenMenuId(null)}
            >
                {isLoading
                    ? Array.from({ length: 6 }).map((_, index) => (
                          <Skeleton key={index} className="h-28" />
                      ))
                    : filteredModels.map((model) => {
                          const ctxLabel = formatContextWindow(
                              model.contextWindow,
                          );
                          return (
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
                                      <Button
                                          type="button"
                                          variant="secondary"
                                          size="sm"
                                          disabled={testingModelId !== null}
                                          onClick={async () => {
                                              setTestingModelId(model.id);
                                              try {
                                                  const res = await testProvider({
                                                      providerId: provider.id,
                                                      modelId: model.id,
                                                      apiKeyId:
                                                          selectedVaultKeyId ||
                                                          undefined,
                                                  }).unwrap();
                                                  setTestResults((prev) => ({
                                                      ...prev,
                                                      [model.id]: res,
                                                  }));
                                                  if (res.success) {
                                                      toast.success(
                                                          `${model.code} OK (${res.latencyMs}ms)`,
                                                      );
                                                  } else {
                                                      toast.error(
                                                          res.error ||
                                                              `${model.code} test failed`,
                                                      );
                                                  }
                                              } catch (err: any) {
                                                  toast.error(
                                                      err?.data?.message ||
                                                          "Could not test model",
                                                  );
                                              } finally {
                                                  setTestingModelId(null);
                                              }
                                          }}
                                      >
                                          <PlayIcon size={12} weight="fill" />
                                          {testingModelId === model.id
                                              ? "..."
                                              : "Test"}
                                      </Button>
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
                                                          onClick={() => {
                                                              setConfirmDeleteModel(
                                                                  {
                                                                      id: model.id,
                                                                      name: model.name,
                                                                  },
                                                              );
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
                              <div className="flex flex-wrap gap-1.5">
                                  {ctxLabel ? (
                                      <Badge className="font-mono">
                                          {ctxLabel}
                                      </Badge>
                                  ) : null}
                                  {model.supportsTools ? (
                                      <Badge>Tools</Badge>
                                  ) : null}
                                  {model.supportsVision ? (
                                      <Badge>Vision</Badge>
                                  ) : null}
                                  {model.thinking ? (
                                      <Badge>Thinking</Badge>
                                  ) : null}
                                  {model.rpmLimit ? (
                                      <Badge className="font-mono">
                                          {model.rpmLimit} RPM
                                      </Badge>
                                  ) : null}
                                  {model.rpdLimit ? (
                                      <Badge className="font-mono">
                                          {model.rpdLimit} RPD
                                      </Badge>
                                  ) : null}
                                  {model.efficiencyScore !== null ? (
                                      <Badge>
                                          {Math.round(
                                              model.efficiencyScore * 100,
                                          )}
                                          % efficient
                                      </Badge>
                                  ) : null}
                                  {model.bestFor.map((item) => (
                                      <Badge key={item}>{item}</Badge>
                                  ))}
                              </div>
                              {testResults[model.id] ? (
                                  <p
                                      className={`truncate font-mono text-xs ${
                                          testResults[model.id].success
                                              ? "text-(--color-status-success)"
                                              : "text-(--color-status-error)"
                                      }`}
                                      title={
                                          testResults[model.id].success
                                              ? testResults[model.id].reply
                                              : testResults[model.id].error
                                      }
                                  >
                                      {testResults[model.id].success
                                          ? `OK • ${testResults[model.id].latencyMs}ms${testResults[model.id].reply ? ` • ${testResults[model.id].reply}` : ""}`
                                          : `Failed (${testResults[model.id].latencyMs}ms): ${testResults[model.id].error}`}
                                  </p>
                              ) : null}
                          </div>
                      );
                      })}
                {!isLoading && filteredModels.length === 0 ? (
                    <div className="md:col-span-2">
                        <EmptyState
                            compact
                            title={
                                models.length === 0
                                    ? "No models found"
                                    : "No matching models"
                            }
                            description={
                                models.length === 0
                                    ? "This provider does not have any models in its catalog yet."
                                    : "Try adjusting your search or capability filter."
                            }
                        />
                    </div>
                ) : null}
            </div>
            {editModel ? (
                <EditModelModal
                    model={editModel}
                    onClose={() => setEditModel(null)}
                />
            ) : null}
            {confirmDeleteModel ? (
                <ConfirmModal
                    title="Delete Model"
                    description={`Are you sure you want to delete "${confirmDeleteModel.name}"?`}
                    isLoading={deleteModelState.isLoading}
                    onConfirm={async () => {
                        try {
                            await deleteModel(confirmDeleteModel.id).unwrap();
                            toast.success("Model deleted");
                            setConfirmDeleteModel(null);
                        } catch {
                            toast.error("Could not delete model");
                        }
                    }}
                    onCancel={() => setConfirmDeleteModel(null)}
                />
            ) : null}
        </Modal>
    );
}
