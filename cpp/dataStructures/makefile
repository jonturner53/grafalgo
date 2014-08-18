SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

all:
	make -C basic       BIN='${BIN}' ARCH='${ARCH}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C hash       BIN='${BIN}' ARCH='${ARCH}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C graphs      BIN='${BIN}' ARCH='${ARCH}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C heaps       BIN='${BIN}' ARCH='${ARCH}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C searchTrees BIN='${BIN}' ARCH='${ARCH}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C advanced    BIN='${BIN}' ARCH='${ARCH}' \
				CXXFLAGS='${CXXFLAGS}' all

clean:
	make -C basic       clean
	make -C hash       clean
	make -C graphs      clean
	make -C heaps       clean
	make -C searchTrees clean
	make -C advanced    clean
