import React from 'react'
import styled from 'styled-components'

const Backdrop = styled.div`
  position: fixed;
  display: flex;
  gap: 10px;
  bottom: 16px;
  right: 16px;
  align-items: flex-end;
`

export default function HelperButtonGroup() {
  return (
    <Backdrop>
      <div className="wrapper-group">
      </div>
    </Backdrop>
  )
}
