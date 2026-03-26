<?php

namespace App\Modules\Settings\RecycleBin;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class RecycleBinService
{
    public function paginate(string $search = '', string $module = '', int $perPage = 10): LengthAwarePaginator
    {
        $search = trim($search);
        $module = trim($module);

        $rows = collect($this->discoverModels())
            ->flatMap(function (array $config) {
                $class = $config['class'];

                return $class::query()
                    ->onlyTrashed()
                    ->get()
                    ->map(fn (Model $entity) => $this->toRow($entity, $config));
            })
            ->filter(function (array $row) use ($search, $module) {
                if ($module !== '' && $row['module_slug'] !== $module) {
                    return false;
                }

                if ($search === '') {
                    return true;
                }

                $haystack = Str::lower(implode(' ', [
                    $row['module_name'],
                    $row['feature_name'],
                    $row['title'],
                    $row['subtitle'],
                    $row['id'],
                ]));

                return Str::contains($haystack, Str::lower($search));
            })
            ->sortByDesc('deleted_at')
            ->values();

        $currentPage = Paginator::resolveCurrentPage();
        $offset = max(0, ($currentPage - 1) * $perPage);
        $items = $rows->slice($offset, $perPage)->values()->all();

        return new Paginator(
            $items,
            $rows->count(),
            $perPage,
            $currentPage,
            [
                'path' => Paginator::resolveCurrentPath(),
                'query' => request()->query(),
            ]
        );
    }

    public function getModuleOptions(): array
    {
        return collect($this->discoverModels())
            ->map(fn (array $item) => [
                'slug' => $item['module_slug'],
                'name' => $item['module_name'],
            ])
            ->unique('slug')
            ->sortBy('name')
            ->values()
            ->all();
    }

    public function restore(string $modelKey, int $id): bool
    {
        $config = $this->getConfig($modelKey);
        $class = $config['class'];

        $entity = $class::query()->onlyTrashed()->findOrFail($id);

        return (bool) $entity->restore();
    }

    public function forceDelete(string $modelKey, int $id): bool
    {
        $config = $this->getConfig($modelKey);
        $class = $config['class'];

        $entity = $class::query()->onlyTrashed()->findOrFail($id);

        return (bool) $entity->forceDelete();
    }

    public function forceDeleteBulk(array $items): int
    {
        $deletedCount = 0;

        foreach ($items as $item) {
            $modelKey = trim((string) ($item['model_key'] ?? ''));
            $recordId = (int) ($item['record_id'] ?? 0);

            if ($modelKey === '' || $recordId <= 0) {
                continue;
            }

            $config = $this->getConfig($modelKey);
            $class = $config['class'];

            $entity = $class::query()
                ->onlyTrashed()
                ->find($recordId);

            if (!$entity) {
                continue;
            }

            $entity->forceDelete();
            $deletedCount++;
        }

        return $deletedCount;
    }

    private function getConfig(string $modelKey): array
    {
        $config = $this->discoverModels()[$modelKey] ?? null;

        abort_if(!$config, 404, 'Model recycle bin tidak ditemukan.');

        return $config;
    }

    private function discoverModels(): array
    {
        static $cache = null;

        if ($cache !== null) {
            return $cache;
        }

        $appPath = app_path();
        $files = collect(File::glob($appPath . '/Modules/*/*/*Entity.php'));

        $items = $files
            ->map(function (string $path) use ($appPath) {
                $relative = str_replace($appPath . '/', '', $path);
                $class = 'App\\' . str_replace(['/', '.php'], ['\\', ''], $relative);

                if (!class_exists($class)) {
                    return null;
                }

                $uses = class_uses_recursive($class);

                if (!in_array(SoftDeletes::class, $uses, true)) {
                    return null;
                }

                $parts = explode('\\', $class);
                $moduleName = $parts[2] ?? 'General';
                $featureName = $parts[3] ?? class_basename($class);
                $moduleSlug = Str::kebab(Str::lower($moduleName));
                $featureSlug = Str::kebab($featureName);
                $modelKey = $moduleSlug . '::' . $featureSlug;

                return [
                    'key' => $modelKey,
                    'class' => $class,
                    'module_name' => $moduleName,
                    'module_slug' => $moduleSlug,
                    'feature_name' => str_replace('-', ' ', $featureSlug),
                ];
            })
            ->filter()
            ->mapWithKeys(fn (array $item) => [$item['key'] => $item])
            ->all();

        $cache = $items;

        return $cache;
    }

    private function toRow(Model $entity, array $config): array
    {
        $attributes = $entity->getAttributes();
        $title = $this->resolveTitle($attributes, $entity->getKey());
        $subtitle = $this->resolveSubtitle($attributes, $title);
        $deletedAt = $entity->deleted_at instanceof Carbon
            ? $entity->deleted_at
            : Carbon::parse((string) $entity->deleted_at);

        return [
            'model_key' => $config['key'],
            'id' => (int) $entity->getKey(),
            'module_name' => $config['module_name'],
            'module_slug' => $config['module_slug'],
            'feature_name' => Str::title($config['feature_name']),
            'title' => $title,
            'subtitle' => $subtitle,
            'deleted_at' => $deletedAt->toDateTimeString(),
            'deleted_at_human' => $deletedAt->diffForHumans(),
        ];
    }

    private function resolveTitle(array $attributes, mixed $fallback): string
    {
        $candidates = ['nama', 'name', 'kode', 'no_identitas', 'email', 'tanggal'];

        foreach ($candidates as $column) {
            $value = trim((string) ($attributes[$column] ?? ''));

            if ($value !== '') {
                return $value;
            }
        }

        return 'ID ' . $fallback;
    }

    private function resolveSubtitle(array $attributes, string $title): string
    {
        $summaryColumns = ['kode', 'nama', 'name', 'email', 'status', 'tipe'];

        $parts = collect($summaryColumns)
            ->map(function (string $column) use ($attributes) {
                $value = trim((string) ($attributes[$column] ?? ''));

                if ($value === '') {
                    return null;
                }

                return $column . ': ' . $value;
            })
            ->filter()
            ->unique()
            ->values()
            ->all();

        $subtitle = implode(' | ', $parts);

        if ($subtitle === '' || Str::contains(Str::lower($subtitle), Str::lower($title))) {
            return '-';
        }

        return $subtitle;
    }
}
