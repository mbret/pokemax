import React, { ComponentProps, FC } from 'react'
import { Icon, Input } from 'semantic-ui-react'

type InputProps = ComponentProps<typeof Input>

export const Search: FC<{ onChange: InputProps['onChange'], style?: React.CSSProperties }> = ({ onChange, style }) => (
  <div style={{ ...style }}>
    <Input fluid icon size='large' placeholder='pika...' onChange={onChange} >
      <input />
      <Icon name='search' />
    </Input>
  </div>
)