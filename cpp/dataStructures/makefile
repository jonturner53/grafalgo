SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../include
LDIR := ../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

all:
	make -C basic       IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
			    CXXFLAGS='${CXXFLAGS}' all
	make -C hash       IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
			    CXXFLAGS='${CXXFLAGS}' all
	make -C graphs      IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
			    CXXFLAGS='${CXXFLAGS}' all
	make -C heaps       IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
			    CXXFLAGS='${CXXFLAGS}' all
	make -C searchTrees IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
			    CXXFLAGS='${CXXFLAGS}' all
	make -C advanced    IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
			    CXXFLAGS='${CXXFLAGS}' all

clean:
	make -C basic       clean
	make -C hash        clean
	make -C graphs      clean
	make -C heaps       clean
	make -C searchTrees clean
	make -C advanced    clean
