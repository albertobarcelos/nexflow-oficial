import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEntityBuilder } from '@/contexts/EntityBuilderContext';
import { useEntity } from '@/hooks/useEntities';
import NewEntitySettings from './NewEntitySettings';

const EntitySettings: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: entity, isLoading } = useEntity(id);
    const builder = useEntityBuilder();

    useEffect(() => {
        if (entity) {
            builder.setName('name' in entity && typeof entity.name === 'string' ? entity.name : '');
            builder.setSlug('slug' in entity && typeof entity.slug === 'string' ? entity.slug : '');
            builder.setDescription('description' in entity && typeof entity.description === 'string' ? entity.description : '');
            builder.setIcon('icon' in entity && typeof entity.icon === 'string' ? entity.icon : 'database');
            builder.setColor('color' in entity && typeof entity.color === 'string' ? entity.color : '#6366f1');
            builder.setFields(
                Array.isArray(entity.fields)
                    ? entity.fields.map((f) => ({
                        name: 'name' in f && typeof f.name === 'string' ? f.name : '',
                        slug: 'slug' in f && typeof f.slug === 'string' ? f.slug : '',
                        field_type: 'field_type' in f && typeof f.field_type === 'string' ? f.field_type : 'short_text',
                        description: 'description' in f && typeof f.description === 'string' ? f.description : '',
                        is_required: 'is_required' in f ? !!f.is_required : false,
                        is_unique: 'is_unique' in f ? !!f.is_unique : false,
                        options: 'options' in f && Array.isArray(f.options) ? f.options : [],
                        validation_rules: 'validation_rules' in f && typeof f.validation_rules === 'object' && f.validation_rules !== null ? f.validation_rules : {},
                        default_value: 'default_value' in f ? f.default_value ?? null : null,
                        layout_config: 'layout_config' in f && typeof f.layout_config === 'object' && f.layout_config !== null ? f.layout_config : { width: 'full', column: 1 },
                    }))
                    : []
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entity]);

    if (isLoading) return <div className="p-8 text-center">Carregando...</div>;
    if (!entity) return <div className="p-8 text-center text-red-500">Entidade não encontrada</div>;

    return <NewEntitySettings />;
};

export default EntitySettings;
